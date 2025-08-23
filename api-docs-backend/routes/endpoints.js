// routes/endpoints.js
const express = require("express");
const { endpoint } = require("../controllers");
const { auth, validation, rateLimit } = require("../middleware");

const router = express.Router();

// All routes require authentication
router.use(auth);

// Endpoint routes for a specific project
router.get(
  "/project/:projectId",
  validation.validateObjectId("projectId"),
  validation.validatePagination,
  validation.validateSearch,
  endpoint.getEndpoints
);

router.get(
  "/project/:projectId/stats",
  validation.validateObjectId("projectId"),
  endpoint.getEndpointStats
);

router.get(
  "/project/:projectId/tags/:tag",
  validation.validateObjectId("projectId"),
  validation.sanitizeInput,
  endpoint.getEndpointsByTag
);

router.post(
  "/project/:projectId",
  validation.validateObjectId("projectId"),
  rateLimit.subscriptionBased,
  validation.validateEndpoint,
  endpoint.createEndpoint
);

// Individual endpoint operations
router.get("/:id", validation.validateObjectId("id"), endpoint.getEndpoint);

router.put(
  "/:id",
  validation.validateObjectId("id"),
  validation.validateEndpoint,
  endpoint.updateEndpoint
);

router.delete(
  "/:id",
  validation.validateObjectId("id"),
  endpoint.deleteEndpoint
);

router.post(
  "/:id/duplicate",
  validation.validateObjectId("id"),
  validation.sanitizeInput,
  endpoint.duplicateEndpoint
);

// Bulk operations
router.put(
  "/project/:projectId/reorder",
  validation.validateObjectId("projectId"),
  validation.sanitizeInput,
  endpoint.reorderEndpoints
);

module.exports = router;
