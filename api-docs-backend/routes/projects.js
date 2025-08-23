// routes/projects.js
const express = require("express");
const { project } = require("../controllers");
const { auth, validation, rateLimit } = require("../middleware");

const router = express.Router();

// All routes require authentication
router.use(auth);

// Project CRUD operations
router.get(
  "/",
  rateLimit.subscriptionBased,
  validation.validatePagination,
  validation.validateSearch,
  project.getAllProjects
);

router.get("/:id", validation.validateObjectId("id"), project.getProject);

router.post(
  "/",
  rateLimit.subscriptionBased,
  validation.validateProject,
  project.createProject
);

router.put(
  "/:id",
  validation.validateObjectId("id"),
  validation.validateProject,
  project.updateProject
);

router.delete("/:id", validation.validateObjectId("id"), project.deleteProject);

// Collaboration routes
router.post(
  "/:id/collaborators",
  validation.validateObjectId("id"),
  validation.sanitizeInput,
  project.addCollaborator
);

router.put(
  "/:id/collaborators/:collaboratorId",
  validation.validateObjectId("id"),
  validation.validateObjectId("collaboratorId"),
  validation.sanitizeInput,
  project.updateCollaborator
);

router.delete(
  "/:id/collaborators/:collaboratorId",
  validation.validateObjectId("id"),
  validation.validateObjectId("collaboratorId"),
  project.removeCollaborator
);

// Analytics
router.get(
  "/:id/analytics",
  validation.validateObjectId("id"),
  project.getProjectAnalytics
);

module.exports = router;
