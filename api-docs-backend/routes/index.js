// routes/index.js
const express = require("express");
const { env } = require("../config");

// Import route modules
const authRoutes = require("./auth");
const projectRoutes = require("./projects");
const endpointRoutes = require("./endpoints");
const testRoutes = require("./tests");
const documentationRoutes = require("./documentation");
const uploadRoutes = require("./upload");

const router = express.Router();

// API version and prefix
const API_PREFIX = env.API_PREFIX || "/api";
const API_VERSION = env.API_VERSION || "v1";

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API Documentation Generator is running",
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: API_VERSION,
      environment: env.NODE_ENV,
    },
  });
});

// API Info endpoint
router.get("/info", (req, res) => {
  res.json({
    success: true,
    message: "API Information",
    data: {
      name: "API Documentation Generator",
      version: API_VERSION,
      description: "Create, manage, and share beautiful API documentation",
      endpoints: {
        auth: `${API_PREFIX}/auth`,
        projects: `${API_PREFIX}/projects`,
        endpoints: `${API_PREFIX}/endpoints`,
        tests: `${API_PREFIX}/tests`,
        documentation: `${API_PREFIX}/docs`,
        upload: `${API_PREFIX}/upload`,
      },
      features: [
        "User authentication & management",
        "Project collaboration",
        "API endpoint documentation",
        "Interactive API testing",
        "Multiple export formats",
        "Import from Postman/OpenAPI",
      ],
    },
  });
});

// Mount route modules
router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
router.use("/endpoints", endpointRoutes);
router.use("/tests", testRoutes);
router.use("/docs", documentationRoutes);
router.use("/upload", uploadRoutes);

// 404 handler for API routes
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
    data: {
      availableEndpoints: [
        `${API_PREFIX}/health`,
        `${API_PREFIX}/info`,
        `${API_PREFIX}/auth`,
        `${API_PREFIX}/projects`,
        `${API_PREFIX}/endpoints`,
        `${API_PREFIX}/tests`,
        `${API_PREFIX}/docs`,
        `${API_PREFIX}/upload`,
      ],
    },
  });
});

module.exports = router;
