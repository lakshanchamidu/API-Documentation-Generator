// config/cors.js
const {
  CORS_ORIGIN,
  CORS_METHODS,
  CORS_ALLOWED_HEADERS,
  NODE_ENV,
} = require("./environment");

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = Array.isArray(CORS_ORIGIN)
      ? CORS_ORIGIN
      : CORS_ORIGIN.split(",").map((origin) => origin.trim());

    // In development, allow localhost on any port
    if (NODE_ENV === "development") {
      const localhostRegex = /^http:\/\/localhost:\d+$/;
      if (localhostRegex.test(origin) || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
    }

    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS policy"));
    }
  },

  methods: CORS_METHODS.split(",").map((method) => method.trim()),

  allowedHeaders: CORS_ALLOWED_HEADERS.split(",").map((header) =>
    header.trim()
  ),

  credentials: true, // Allow cookies and authorization headers

  optionsSuccessStatus: 200, // Some legacy browsers choke on 204

  maxAge: 86400, // Cache preflight response for 24 hours

  // Expose headers that frontend might need
  exposedHeaders: [
    "X-Total-Count",
    "X-Page-Count",
    "X-Current-Page",
    "X-Per-Page",
    "Content-Range",
  ],
};

// Custom CORS handler for more control
const customCorsHandler = (req, res, next) => {
  const origin = req.headers.origin;

  // Set CORS headers
  if (origin && corsOptions.origin) {
    corsOptions.origin(origin, (err, allowed) => {
      if (err) {
        return res.status(403).json({
          error: "CORS Error",
          message: err.message,
        });
      }

      if (allowed) {
        res.header("Access-Control-Allow-Origin", origin);
      }
    });
  }

  res.header("Access-Control-Allow-Methods", corsOptions.methods.join(","));
  res.header(
    "Access-Control-Allow-Headers",
    corsOptions.allowedHeaders.join(",")
  );
  res.header("Access-Control-Allow-Credentials", corsOptions.credentials);
  res.header("Access-Control-Max-Age", corsOptions.maxAge);

  if (corsOptions.exposedHeaders) {
    res.header(
      "Access-Control-Expose-Headers",
      corsOptions.exposedHeaders.join(",")
    );
  }

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(corsOptions.optionsSuccessStatus).end();
  }

  next();
};

module.exports = {
  corsOptions,
  customCorsHandler,
};
