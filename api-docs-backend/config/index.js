// config/index.js
const connectDB = require("./database");
const {
  generateToken,
  verifyToken,
  decodeToken,
  refreshToken,
  getTokenExpiry,
  JWT_CONFIG,
} = require("./jwt");
const environment = require("./environment");
const { corsOptions, customCorsHandler } = require("./cors");

// Validate configuration on startup
try {
  environment.validateConfig();
  console.log("Configuration validated successfully");
} catch (error) {
  console.error("Configuration validation failed:", error.message);
  process.exit(1);
}

module.exports = {
  // Database
  connectDB,

  // JWT
  jwt: {
    generateToken,
    verifyToken,
    decodeToken,
    refreshToken,
    getTokenExpiry,
    config: JWT_CONFIG,
  },

  // Environment
  env: environment,

  // CORS
  cors: {
    options: corsOptions,
    handler: customCorsHandler,
  },
};
