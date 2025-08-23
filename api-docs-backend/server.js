// server.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

// Import configurations and utilities
const { connectDB, env } = require("./config");
const { logger } = require("./utils");
const {
  errors: { globalErrorHandler, notFound },
  validation: { sanitizeInput },
  rateLimit: { general: generalLimiter },
} = require("./middleware");

const routes = require("./routes");

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(compression());

app.use(
  cors({
    origin: env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        res.status(400).json({
          success: false,
          message: "Invalid JSON in request body",
        });
        return;
      }
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

if (env.NODE_ENV !== "test") {
  app.use((req, res, next) => {
    const start = Date.now();

    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    const originalEnd = res.end;
    res.end = (...args) => {
      const duration = Date.now() - start;
      console.log(
        `${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`
      );
      originalEnd.apply(res, args);
    };

    next();
  });
}

app.use(sanitizeInput);

app.use(generalLimiter);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
        total:
          Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
      },
      version: process.version,
      environment: env.NODE_ENV,
      database: "connected",
    },
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to API Documentation Generator",
    data: {
      name: "API Documentation Generator",
      version: env.API_VERSION || "1.0.0",
      description: "Create, manage, and share beautiful API documentation",
      documentation: `${req.protocol}://${req.get("host")}/api/docs`,
      health: `${req.protocol}://${req.get("host")}/health`,
      endpoints: {
        auth: `${req.protocol}://${req.get("host")}/api/auth`,
        projects: `${req.protocol}://${req.get("host")}/api/projects`,
        endpoints: `${req.protocol}://${req.get("host")}/api/endpoints`,
        tests: `${req.protocol}://${req.get("host")}/api/tests`,
        documentation: `${req.protocol}://${req.get("host")}/api/docs`,
        upload: `${req.protocol}://${req.get("host")}/api/upload`,
      },
    },
  });
});

app.use(env.API_PREFIX || "/api", routes);

app.use(
  "/static",
  express.static("public", {
    maxAge: "1d",
    etag: true,
  })
);

app.use(notFound);

app.use(globalErrorHandler);

const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  if (global.server) {
    global.server.close((err) => {
      if (err) {
        console.error("Error during server shutdown:", err.message);
        process.exit(1);
      }

      console.log("Server closed successfully");
      process.exit(0);
    });

    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  console.error(err.stack);

  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise);
  console.error("Reason:", reason);

  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

const startServer = async () => {
  try {
    await connectDB();
    console.log("Database connected successfully");

    const PORT = env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`Server started successfully on port ${PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API base URL: http://localhost:${PORT}/api`);

      if (env.NODE_ENV === "development") {
        console.log("\n Available endpoints:");
        console.log(`   Health: http://localhost:${PORT}/health`);
        console.log(`   API Info: http://localhost:${PORT}/api`);
        console.log(`   Auth: http://localhost:${PORT}/api/auth`);
        console.log(`   Projects: http://localhost:${PORT}/api/projects`);
        console.log(`   Endpoints: http://localhost:${PORT}/api/endpoints`);
        console.log(`   Tests: http://localhost:${PORT}/api/tests`);
        console.log(`   Documentation: http://localhost:${PORT}/api/docs`);
        console.log(`   Upload: http://localhost:${PORT}/api/upload`);
        console.log("");
      }
    });

    global.server = server;

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error("❌ Server error:", err.message);
      }
      process.exit(1);
    });

    if (env.NODE_ENV === "production") {
      console.log("🧹 Cleaning old log files...");
    }
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
