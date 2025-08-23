// controllers/endpointController.js
const { Endpoint, Project } = require("../models");
const {
  errors: { catchAsync, AppError },
} = require("../middleware");

const getEndpoints = catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { method, tag, search, sort = "order" } = req.query;

  // Verify project access
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (!project.hasAccess(req.userId)) {
    throw new AppError("Access denied", 403);
  }

  // Build query
  let query = { projectId };

  if (method) {
    query.method = method.toUpperCase();
  }

  if (tag) {
    query.tags = { $in: [tag] };
  }

  if (search) {
    query.$or = [
      { summary: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { path: { $regex: search, $options: "i" } },
    ];
  }

  const endpoints = await Endpoint.find(query).sort(sort);

  // Group endpoints by tags for better organization
  const groupedByTags = endpoints.reduce((acc, endpoint) => {
    if (endpoint.tags && endpoint.tags.length > 0) {
      endpoint.tags.forEach((tag) => {
        if (!acc[tag]) acc[tag] = [];
        acc[tag].push(endpoint);
      });
    } else {
      if (!acc["untagged"]) acc["untagged"] = [];
      acc["untagged"].push(endpoint);
    }
    return acc;
  }, {});

  res.json({
    success: true,
    message: "Endpoints retrieved successfully",
    data: {
      endpoints,
      groupedByTags,
      statistics: {
        total: endpoints.length,
        byMethod: endpoints.reduce((acc, ep) => {
          acc[ep.method] = (acc[ep.method] || 0) + 1;
          return acc;
        }, {}),
        byTag: Object.keys(groupedByTags).map((tag) => ({
          tag,
          count: groupedByTags[tag].length,
        })),
      },
    },
  });
});

const getEndpoint = catchAsync(async (req, res) => {
  const { id } = req.params;

  const endpoint = await Endpoint.findById(id).populate("projectId");

  if (!endpoint) {
    throw new AppError("Endpoint not found", 404);
  }

  // Check project access
  if (!endpoint.projectId.hasAccess(req.userId)) {
    throw new AppError("Access denied", 403);
  }

  res.json({
    success: true,
    message: "Endpoint retrieved successfully",
    data: {
      endpoint,
    },
  });
});

const createEndpoint = catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const endpointData = req.body;

  // Verify project access
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (!project.hasAccess(req.userId, "editor")) {
    throw new AppError("Insufficient permissions to create endpoints", 403);
  }

  // Check for duplicate endpoint (same method and path)
  const existingEndpoint = await Endpoint.findOne({
    projectId,
    method: endpointData.method.toUpperCase(),
    path: endpointData.path,
  });

  if (existingEndpoint) {
    throw new AppError(
      `Endpoint ${endpointData.method} ${endpointData.path} already exists`,
      400
    );
  }

  // Create endpoint
  const endpoint = new Endpoint({
    ...endpointData,
    projectId,
    method: endpointData.method.toUpperCase(),
  });

  await endpoint.save();

  res.status(201).json({
    success: true,
    message: "Endpoint created successfully",
    data: {
      endpoint,
    },
  });
});

const updateEndpoint = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const endpoint = await Endpoint.findById(id).populate("projectId");

  if (!endpoint) {
    throw new AppError("Endpoint not found", 404);
  }

  // Check project access
  if (!endpoint.projectId.hasAccess(req.userId, "editor")) {
    throw new AppError("Insufficient permissions to update this endpoint", 403);
  }

  // If updating method or path, check for duplicates
  if (updateData.method || updateData.path) {
    const method = updateData.method
      ? updateData.method.toUpperCase()
      : endpoint.method;
    const path = updateData.path || endpoint.path;

    const existingEndpoint = await Endpoint.findOne({
      _id: { $ne: id },
      projectId: endpoint.projectId._id,
      method,
      path,
    });

    if (existingEndpoint) {
      throw new AppError(`Endpoint ${method} ${path} already exists`, 400);
    }
  }

  // Update endpoint
  const updatedEndpoint = await Endpoint.findByIdAndUpdate(
    id,
    {
      ...updateData,
      method: updateData.method
        ? updateData.method.toUpperCase()
        : endpoint.method,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.json({
    success: true,
    message: "Endpoint updated successfully",
    data: {
      endpoint: updatedEndpoint,
    },
  });
});

const deleteEndpoint = catchAsync(async (req, res) => {
  const { id } = req.params;

  const endpoint = await Endpoint.findById(id).populate("projectId");

  if (!endpoint) {
    throw new AppError("Endpoint not found", 404);
  }

  // Check project access
  if (!endpoint.projectId.hasAccess(req.userId, "editor")) {
    throw new AppError("Insufficient permissions to delete this endpoint", 403);
  }

  await Endpoint.findByIdAndDelete(id);

  res.json({
    success: true,
    message: "Endpoint deleted successfully",
  });
});

const duplicateEndpoint = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { path, summary } = req.body;

  const originalEndpoint = await Endpoint.findById(id).populate("projectId");

  if (!originalEndpoint) {
    throw new AppError("Endpoint not found", 404);
  }

  // Check project access
  if (!originalEndpoint.projectId.hasAccess(req.userId, "editor")) {
    throw new AppError(
      "Insufficient permissions to duplicate this endpoint",
      403
    );
  }

  // Check if new path already exists
  const existingEndpoint = await Endpoint.findOne({
    projectId: originalEndpoint.projectId._id,
    method: originalEndpoint.method,
    path: path || `${originalEndpoint.path}-copy`,
  });

  if (existingEndpoint) {
    throw new AppError("Endpoint with this path already exists", 400);
  }

  // Create duplicate
  const duplicateData = originalEndpoint.toObject();
  delete duplicateData._id;
  delete duplicateData.createdAt;
  delete duplicateData.updatedAt;
  delete duplicateData.operationId;

  const duplicatedEndpoint = new Endpoint({
    ...duplicateData,
    path: path || `${originalEndpoint.path}-copy`,
    summary: summary || `${originalEndpoint.summary} (Copy)`,
  });

  await duplicatedEndpoint.save();

  res.status(201).json({
    success: true,
    message: "Endpoint duplicated successfully",
    data: {
      endpoint: duplicatedEndpoint,
    },
  });
});

const reorderEndpoints = catchAsync(async (req, res) => {
  const { projectId } = req.params;
  const { endpointOrders } = req.body; // Array of { id, order }

  // Verify project access
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (!project.hasAccess(req.userId, "editor")) {
    throw new AppError("Insufficient permissions to reorder endpoints", 403);
  }

  // Update order for each endpoint
  const updatePromises = endpointOrders.map(({ id, order }) =>
    Endpoint.findByIdAndUpdate(id, { order }, { new: true })
  );

  const updatedEndpoints = await Promise.all(updatePromises);

  res.json({
    success: true,
    message: "Endpoints reordered successfully",
    data: {
      endpoints: updatedEndpoints,
    },
  });
});

const getEndpointsByTag = catchAsync(async (req, res) => {
  const { projectId, tag } = req.params;

  // Verify project access
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (!project.hasAccess(req.userId)) {
    throw new AppError("Access denied", 403);
  }

  const endpoints = await Endpoint.find({
    projectId,
    tags: tag,
  }).sort("order");

  res.json({
    success: true,
    message: `Endpoints with tag '${tag}' retrieved successfully`,
    data: {
      tag,
      endpoints,
      count: endpoints.length,
    },
  });
});

const getEndpointStats = catchAsync(async (req, res) => {
  const { projectId } = req.params;

  // Verify project access
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (!project.hasAccess(req.userId)) {
    throw new AppError("Access denied", 403);
  }

  const stats = await Endpoint.aggregate([
    { $match: { projectId: project._id } },
    {
      $facet: {
        methodStats: [
          { $group: { _id: "$method", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        tagStats: [
          { $unwind: "$tags" },
          { $group: { _id: "$tags", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        statusStats: [
          {
            $group: {
              _id: {
                $cond: [{ $eq: ["$deprecated", true] }, "deprecated", "active"],
              },
              count: { $sum: 1 },
            },
          },
        ],
        responseCodeStats: [
          { $unwind: "$responses" },
          { $group: { _id: "$responses.statusCode", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ]);

  const totalEndpoints = await Endpoint.countDocuments({ projectId });

  res.json({
    success: true,
    message: "Endpoint statistics retrieved successfully",
    data: {
      totalEndpoints,
      methodDistribution: stats[0].methodStats,
      tagDistribution: stats[0].tagStats,
      statusDistribution: stats[0].statusStats,
      responseCodeDistribution: stats[0].responseCodeStats,
    },
  });
});

module.exports = {
  getEndpoints,
  getEndpoint,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  duplicateEndpoint,
  reorderEndpoints,
  getEndpointsByTag,
  getEndpointStats,
};
