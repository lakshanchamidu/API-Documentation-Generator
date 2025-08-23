// middleware/validation.js
const { body, param, query, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errorMessages,
    });
  }

  next();
};

const validateRegister = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase, one uppercase, and one number"
    ),

  handleValidationErrors,
];

const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

const validateProject = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Project name must be between 2 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("baseUrl")
    .optional()
    .isURL()
    .withMessage("Base URL must be a valid URL"),

  body("version")
    .optional()
    .matches(/^\d+\.\d+\.\d+$/)
    .withMessage("Version must follow semantic versioning (e.g., 1.0.0)"),

  body("isPublic")
    .optional()
    .isBoolean()
    .withMessage("isPublic must be a boolean"),

  handleValidationErrors,
];

const validateEndpoint = [
  body("method")
    .isIn(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    .withMessage("Invalid HTTP method"),

  body("path").trim().matches(/^\/.*/).withMessage("Path must start with /"),

  body("summary")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Summary must be between 1 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("parameters")
    .optional()
    .isArray()
    .withMessage("Parameters must be an array"),

  body("parameters.*.name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Parameter name is required"),

  body("parameters.*.type")
    .optional()
    .isIn(["string", "number", "integer", "boolean", "array", "object", "file"])
    .withMessage("Invalid parameter type"),

  body("responses")
    .isArray({ min: 1 })
    .withMessage("At least one response is required"),

  body("responses.*.statusCode")
    .isInt({ min: 100, max: 599 })
    .withMessage("Status code must be between 100 and 599"),

  body("responses.*.description")
    .trim()
    .notEmpty()
    .withMessage("Response description is required"),

  handleValidationErrors,
];

const validateTestCase = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Test case name must be between 1 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("environment")
    .optional()
    .isIn(["development", "staging", "production", "custom"])
    .withMessage("Invalid environment"),

  body("expectedResponse.statusCode")
    .optional()
    .isInt({ min: 100, max: 599 })
    .withMessage("Expected status code must be between 100 and 599"),

  handleValidationErrors,
];

const validateObjectId = (paramName = "id") => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName} format`),

  handleValidationErrors,
];

const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("sort")
    .optional()
    .isIn([
      "name",
      "createdAt",
      "updatedAt",
      "-name",
      "-createdAt",
      "-updatedAt",
    ])
    .withMessage("Invalid sort field"),

  handleValidationErrors,
];

const validateSearch = [
  query("q")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search query must be between 1 and 100 characters"),

  query("tags")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        return value.split(",").every((tag) => tag.trim().length > 0);
      }
      return (
        Array.isArray(value) &&
        value.every((tag) => typeof tag === "string" && tag.trim().length > 0)
      );
    })
    .withMessage("Tags must be valid strings"),

  handleValidationErrors,
];

const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === "string") {
      return obj
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    if (obj && typeof obj === "object") {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }

    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateProject,
  validateEndpoint,
  validateTestCase,
  validateObjectId,
  validatePagination,
  validateSearch,
  sanitizeInput,
};
