// routes/documentation.js
const express = require("express");
const { documentation } = require("../controllers");
const { auth, optionalAuth, validation, rateLimit } = require("../middleware");

const router = express.Router();

// Public documentation routes (no authentication required for public projects)
router.get(
  "/public/:id",
  rateLimit.documentation,
  validation.validateObjectId("id"),
  documentation.getPublicDocumentation
);

router.get(
  "/public/:id/openapi",
  rateLimit.documentation,
  validation.validateObjectId("id"),
  documentation.generateOpenAPISpec
);

router.get(
  "/public/:id/markdown",
  rateLimit.documentation,
  validation.validateObjectId("id"),
  documentation.generateMarkdownDocs
);

router.get(
  "/public/:id/html",
  rateLimit.documentation,
  validation.validateObjectId("id"),
  documentation.generateHTML
);

// Protected routes (authentication required or optional)
router.get(
  "/:id/openapi",
  optionalAuth,
  rateLimit.documentation,
  validation.validateObjectId("id"),
  documentation.generateOpenAPISpec
);

router.get(
  "/:id/markdown",
  optionalAuth,
  rateLimit.documentation,
  validation.validateObjectId("id"),
  documentation.generateMarkdownDocs
);

router.get(
  "/:id/html",
  optionalAuth,
  rateLimit.documentation,
  validation.validateObjectId("id"),
  documentation.generateHTML
);

router.get(
  "/:id/export",
  optionalAuth,
  rateLimit.documentation,
  validation.validateObjectId("id"),
  validation.sanitizeInput,
  documentation.exportDocumentation
);

// Authenticated routes only
router.use(auth);

router.get(
  "/:id/validate",
  validation.validateObjectId("id"),
  documentation.validateDocumentation
);

module.exports = router;
