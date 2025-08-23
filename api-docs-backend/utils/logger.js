// utils/logger.js
const fs = require("fs");
const path = require("path");
const { env } = require("../config");

class Logger {
  constructor() {
    this.logLevel = env.LOG_LEVEL || "info";
    this.logFile = env.LOG_FILE || "./logs/app.log";
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };

    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const pid = process.pid;

    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      pid,
      message,
      ...meta,
    };

    return JSON.stringify(logEntry);
  }

  writeToFile(formattedMessage) {
    if (env.NODE_ENV !== "test") {
      fs.appendFileSync(this.logFile, formattedMessage + "\n");
    }
  }

  writeToConsole(level, message, meta = {}) {
    const colors = {
      error: "\x1b[31m", // Red
      warn: "\x1b[33m", // Yellow
      info: "\x1b[36m", // Cyan
      debug: "\x1b[90m", // Gray
    };

    const reset = "\x1b[0m";
    const timestamp = new Date().toISOString();

    const coloredLevel = `${colors[level]}[${level.toUpperCase()}]${reset}`;
    const coloredTimestamp = `\x1b[90m${timestamp}${reset}`;

    let output = `${coloredTimestamp} ${coloredLevel} ${message}`;

    if (Object.keys(meta).length > 0) {
      output += `\n${colors[level]}${JSON.stringify(meta, null, 2)}${reset}`;
    }

    console.log(output);
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, meta);

    // Write to console in development
    if (env.NODE_ENV === "development") {
      this.writeToConsole(level, message, meta);
    }

    // Always write to file
    this.writeToFile(formattedMessage);
  }

  error(message, meta = {}) {
    this.log("error", message, meta);
  }

  warn(message, meta = {}) {
    this.log("warn", message, meta);
  }

  info(message, meta = {}) {
    this.log("info", message, meta);
  }

  debug(message, meta = {}) {
    this.log("debug", message, meta);
  }

  // Express middleware for request logging
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();

      // Log request
      this.info("Incoming request", {
        method: req.method,
        url: req.url,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
        userId: req.userId || null,
      });

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = (...args) => {
        const duration = Date.now() - start;

        this.info("Request completed", {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userId: req.userId || null,
        });

        originalEnd.apply(res, args);
      };

      next();
    };
  }

  // Log database operations
  dbLogger(operation, collection, query = {}, result = {}) {
    this.debug("Database operation", {
      operation,
      collection,
      query,
      result:
        typeof result === "object" ? { ...result, data: "[DATA]" } : result,
    });
  }

  // Log authentication events
  authLogger(event, userId, details = {}) {
    this.info("Authentication event", {
      event,
      userId,
      ...details,
    });
  }

  // Log security events
  securityLogger(event, details = {}) {
    this.warn("Security event", {
      event,
      ...details,
    });
  }

  // Log performance metrics
  performanceLogger(operation, duration, details = {}) {
    const level = duration > 1000 ? "warn" : "info";
    this.log(level, "Performance metric", {
      operation,
      duration: `${duration}ms`,
      ...details,
    });
  }

  // Clean old log files
  cleanOldLogs(daysToKeep = 7) {
    const logDir = path.dirname(this.logFile);
    const files = fs.readdirSync(logDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    files.forEach((file) => {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        this.info("Deleted old log file", { file: filePath });
      }
    });
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
