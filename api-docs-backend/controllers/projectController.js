// controllers/projectController.js
const { Project, Endpoint, User } = require("../models");
const {
  errors: { catchAsync, AppError },
} = require("../middleware");

const getAllProjects = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, sort = "-createdAt", search } = req.query;

  // Build query
  let query = {
    $or: [{ owner: req.userId }, { "collaborators.user": req.userId }],
  };

  // Add search functionality
  if (search) {
    query.$and = [
      query,
      {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      },
    ];
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    populate: [
      { path: "owner", select: "name email avatar" },
      { path: "collaborators.user", select: "name email avatar" },
    ],
  };

  const projects = await Project.paginate(query, options);

  // Get endpoint counts for each project
  const projectIds = projects.docs.map((project) => project._id);
  const endpointCounts = await Endpoint.aggregate([
    { $match: { projectId: { $in: projectIds } } },
    { $group: { _id: "$projectId", count: { $sum: 1 } } },
  ]);

  // Add endpoint counts to projects
  const projectsWithCounts = projects.docs.map((project) => {
    const countData = endpointCounts.find(
      (count) => count._id.toString() === project._id.toString()
    );
    return {
      ...project.toObject(),
      endpointCount: countData ? countData.count : 0,
    };
  });

  res.json({
    success: true,
    message: "Projects retrieved successfully",
    data: {
      projects: projectsWithCounts,
      pagination: {
        currentPage: projects.page,
        totalPages: projects.totalPages,
        totalProjects: projects.totalDocs,
        hasNextPage: projects.hasNextPage,
        hasPrevPage: projects.hasPrevPage,
      },
    },
  });
});

const getProject = catchAsync(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id)
    .populate("owner", "name email avatar")
    .populate("collaborators.user", "name email avatar");

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Check access permissions
  if (!project.hasAccess(req.userId)) {
    throw new AppError("Access denied", 403);
  }

  // Get endpoints for this project
  const endpoints = await Endpoint.find({ projectId: id }).sort({
    order: 1,
    method: 1,
    path: 1,
  });

  // Get project statistics
  const stats = await Endpoint.aggregate([
    { $match: { projectId: project._id } },
    {
      $group: {
        _id: "$method",
        count: { $sum: 1 },
      },
    },
  ]);

  const endpointStats = stats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});

  res.json({
    success: true,
    message: "Project retrieved successfully",
    data: {
      project: {
        ...project.toObject(),
        endpoints,
        statistics: {
          totalEndpoints: endpoints.length,
          endpointsByMethod: endpointStats,
        },
      },
    },
  });
});

const createProject = catchAsync(async (req, res) => {
  const { name, description, baseUrl, version, isPublic, settings } = req.body;

  const project = new Project({
    name,
    description,
    baseUrl,
    version,
    isPublic,
    settings,
    owner: req.userId,
  });

  await project.save();
  await project.populate("owner", "name email avatar");

  res.status(201).json({
    success: true,
    message: "Project created successfully",
    data: {
      project: project.toObject(),
    },
  });
});

const updateProject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const project = await Project.findById(id);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Check if user has edit access
  if (!project.hasAccess(req.userId, "editor")) {
    throw new AppError("Insufficient permissions to edit this project", 403);
  }

  // Don't allow updating owner or collaborators through this endpoint
  delete updateData.owner;
  delete updateData.collaborators;

  const updatedProject = await Project.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("owner", "name email avatar")
    .populate("collaborators.user", "name email avatar");

  res.json({
    success: true,
    message: "Project updated successfully",
    data: {
      project: updatedProject,
    },
  });
});

const deleteProject = catchAsync(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Only owner can delete project
  if (project.owner.toString() !== req.userId) {
    throw new AppError("Only project owner can delete the project", 403);
  }

  // Delete all endpoints associated with this project
  await Endpoint.deleteMany({ projectId: id });

  // Delete the project
  await Project.findByIdAndDelete(id);

  res.json({
    success: true,
    message: "Project deleted successfully",
  });
});

const addCollaborator = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { email, role = "editor" } = req.body;

  const project = await Project.findById(id);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Only owner or admin can add collaborators
  if (!project.hasAccess(req.userId, "admin")) {
    throw new AppError("Insufficient permissions to add collaborators", 403);
  }

  // Find user by email
  const user = await User.findByEmail(email);
  if (!user) {
    throw new AppError("User not found with this email", 404);
  }

  // Check if user is already owner
  if (project.owner.toString() === user._id.toString()) {
    throw new AppError("User is already the project owner", 400);
  }

  // Check if user is already a collaborator
  const existingCollaborator = project.collaborators.find(
    (collab) => collab.user.toString() === user._id.toString()
  );

  if (existingCollaborator) {
    throw new AppError("User is already a collaborator", 400);
  }

  // Add collaborator
  project.collaborators.push({
    user: user._id,
    role,
    addedAt: new Date(),
  });

  await project.save();
  await project.populate("collaborators.user", "name email avatar");

  res.json({
    success: true,
    message: "Collaborator added successfully",
    data: {
      project: project.toObject(),
    },
  });
});

const updateCollaborator = catchAsync(async (req, res) => {
  const { id, collaboratorId } = req.params;
  const { role } = req.body;

  const project = await Project.findById(id);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Only owner or admin can update collaborator roles
  if (!project.hasAccess(req.userId, "admin")) {
    throw new AppError("Insufficient permissions to update collaborator", 403);
  }

  // Find and update collaborator
  const collaborator = project.collaborators.find(
    (collab) => collab.user.toString() === collaboratorId
  );

  if (!collaborator) {
    throw new AppError("Collaborator not found", 404);
  }

  collaborator.role = role;
  await project.save();
  await project.populate("collaborators.user", "name email avatar");

  res.json({
    success: true,
    message: "Collaborator updated successfully",
    data: {
      project: project.toObject(),
    },
  });
});

const removeCollaborator = catchAsync(async (req, res) => {
  const { id, collaboratorId } = req.params;

  const project = await Project.findById(id);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Only owner or admin can remove collaborators (or collaborator can remove themselves)
  if (
    !project.hasAccess(req.userId, "admin") &&
    req.userId !== collaboratorId
  ) {
    throw new AppError("Insufficient permissions to remove collaborator", 403);
  }

  // Remove collaborator
  project.collaborators = project.collaborators.filter(
    (collab) => collab.user.toString() !== collaboratorId
  );

  await project.save();

  res.json({
    success: true,
    message: "Collaborator removed successfully",
  });
});

const getProjectAnalytics = catchAsync(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Check access permissions
  if (!project.hasAccess(req.userId)) {
    throw new AppError("Access denied", 403);
  }

  // Get detailed analytics
  const analytics = await Endpoint.aggregate([
    { $match: { projectId: project._id } },
    {
      $facet: {
        byMethod: [
          { $group: { _id: "$method", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        byTag: [
          { $unwind: "$tags" },
          { $group: { _id: "$tags", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        byStatus: [
          {
            $group: {
              _id: {
                $cond: [{ $eq: ["$deprecated", true] }, "deprecated", "active"],
              },
              count: { $sum: 1 },
            },
          },
        ],
        recentEndpoints: [
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          { $project: { method: 1, path: 1, summary: 1, createdAt: 1 } },
        ],
      },
    },
  ]);

  // Update project view count
  project.analytics.views += 1;
  project.analytics.lastViewed = new Date();
  await project.save();

  res.json({
    success: true,
    message: "Project analytics retrieved successfully",
    data: {
      analytics: {
        totalEndpoints: await Endpoint.countDocuments({ projectId: id }),
        endpointsByMethod: analytics[0].byMethod,
        endpointsByTag: analytics[0].byTag,
        endpointsByStatus: analytics[0].byStatus,
        recentEndpoints: analytics[0].recentEndpoints,
        projectViews: project.analytics.views,
        lastViewed: project.analytics.lastViewed,
      },
    },
  });
});

module.exports = {
  getAllProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addCollaborator,
  updateCollaborator,
  removeCollaborator,
  getProjectAnalytics,
};
