// middleware/rateLimit.js
const rateLimit = require("express-rate-limit");
const { env } = require("../config");
const { rateLimitHandler } = require("./errorHandler");

// Factory function to create a rate limiter
const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: (options.windowMs || env.RATE_LIMIT_WINDOW) * 60 * 1000,
    max: options.max || env.RATE_LIMIT_MAX,
    message: options.message || {
      success: false,
      message: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    skip: (req) => {
      if (env.NODE_ENV === "development" && req.ip === "::1") {
        return true; // skip rate limiting for localhost in dev
      }
      return false;
    },
  });
};

// General predefined limiters
const generalLimiter = createRateLimiter({
  windowMs: 15,
  max: 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again in 15 minutes.",
  },
});

const authLimiter = createRateLimiter({
  windowMs: 15,
  max: 5,
  message: {
    success: false,
    message:
      "Too many authentication attempts, please try again in 15 minutes.",
  },
});

const documentationLimiter = createRateLimiter({
  windowMs: 5,
  max: 20,
  message: {
    success: false,
    message: "Too many documentation requests, please try again in 5 minutes.",
  },
});

const apiTestLimiter = createRateLimiter({
  windowMs: 1,
  max: 10,
  message: {
    success: false,
    message: "Too many API test requests, please try again in 1 minute.",
  },
});

const uploadLimiter = createRateLimiter({
  windowMs: 60,
  max: 5,
  message: {
    success: false,
    message: "Too many file uploads, please try again in 1 hour.",
  },
});

// Pre-create subscription-based limiters
const subscriptionLimiters = {
  enterprise: createRateLimiter({ windowMs: 15, max: 1000 }),
  pro: createRateLimiter({ windowMs: 15, max: 500 }),
  free: createRateLimiter({ windowMs: 15, max: 100 }),
};

// Middleware that selects the right limiter at request time
const subscriptionBasedLimiter = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return generalLimiter(req, res, next); // fallback for guests
  }

  const limiter =
    subscriptionLimiters[user.subscription] || subscriptionLimiters.free;

  return limiter(req, res, next);
};

module.exports = {
  generalLimiter,
  authLimiter,
  documentationLimiter,
  apiTestLimiter,
  uploadLimiter,
  subscriptionBasedLimiter,
  createRateLimiter,
};
