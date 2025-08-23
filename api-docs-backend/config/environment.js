const dotenv = require("dotenv");
dotenv.config();

const config = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database Configuration
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/api-docs-generator",

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-jwt-key",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  JWT_ISSUER: process.env.JWT_ISSUER || "api-docs-generator",
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || "api-docs-users",

  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  CORS_METHODS: process.env.CORS_METHODS || "GET,POST,PUT,DELETE,PATCH,OPTIONS",
  CORS_ALLOWED_HEADERS:
    process.env.CORS_ALLOWED_HEADERS ||
    "Content-Type,Authorization,X-Requested-With",

  // API Configuration
  API_PREFIX: process.env.API_PREFIX || "/api",
  API_VERSION: process.env.API_VERSION || "v1",
};

const validateConfig = () => {
  const required = ["MONGODB_URI", "JWT_SECRET"];
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  if (config.NODE_ENV === "development") {
    if (config.JWT_SECRET === "your-super-secret-jwt-key") {
      console.warn("⚠️ Warning: Using default JWT secret in development");
    }
  }
};

const isDevelopment = () => config.NODE_ENV === "development";
const isProduction = () => config.NODE_ENV === "production";
const isTest = () => config.NODE_ENV === "test";

module.exports = {
  ...config,
  validateConfig,
  isDevelopment,
  isProduction,
  isTest,
};
