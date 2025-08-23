// middleware/index.js
const {
  auth,
  optionalAuth,
  requireSubscription,
  adminOnly,
} = require("./auth");

const {
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
} = require("./validation");

const {
  AppError,
  globalErrorHandler,
  catchAsync,
  notFound,
  rateLimitHandler,
} = require("./errorHandler");

const {
  generalLimiter,
  authLimiter,
  documentationLimiter,
  apiTestLimiter,
  uploadLimiter,
  subscriptionBasedLimiter,
  createRateLimiter,
} = require("./rateLimit");

const {
  upload,
  handleUploadErrors,
  validateUploadedFile,
  cleanupTempFiles,
  singleFileUpload,
  multipleFileUpload,
  fieldsUpload,
} = require("./upload");

module.exports = {
  // Authentication
  auth,
  optionalAuth,
  requireSubscription,
  adminOnly,

  // Validation
  validation: {
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
  },

  // Error Handling
  errors: {
    AppError,
    globalErrorHandler,
    catchAsync,
    notFound,
    rateLimitHandler,
  },

  // Rate Limiting
  rateLimit: {
    general: generalLimiter,
    auth: authLimiter,
    documentation: documentationLimiter,
    apiTest: apiTestLimiter,
    upload: uploadLimiter,
    subscriptionBased: subscriptionBasedLimiter,
    create: createRateLimiter,
  },

  // File Upload
  upload: {
    middleware: upload,
    handleErrors: handleUploadErrors,
    validate: validateUploadedFile,
    cleanup: cleanupTempFiles,
    single: singleFileUpload,
    multiple: multipleFileUpload,
    fields: fieldsUpload,
  },
};
