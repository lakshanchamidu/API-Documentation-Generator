// middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { env } = require("../config");
const { AppError } = require("./errorHandler");

const ensureUploadDir = () => {
  const uploadPath = env.UPLOAD_PATH || "./uploads/";
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir();
    cb(null, env.UPLOAD_PATH || "./uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["json", "yaml", "yml"];
  const fileExtension = path.extname(file.originalname).slice(1).toLowerCase();

  const allowedMimeTypes = [
    "application/json",
    "application/x-yaml",
    "text/yaml",
    "application/yaml",
    "text/plain",
  ];

  if (
    allowedTypes.includes(fileExtension) ||
    allowedMimeTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`,
        400
      ),
      false
    );
  }
};

// Fix: Simple parseFileSize function
const parseFileSize = (size) => {
  if (!size || typeof size !== "string") {
    return 10 * 1024 * 1024; // Default 10MB
  }

  const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
  const match = size.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);

  if (!match) {
    return 10 * 1024 * 1024; // Default 10MB if parsing fails
  }

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  return value * (units[unit] || 1);
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseFileSize(env.MAX_FILE_SIZE || "10MB"),
    files: 5,
  },
  fileFilter: fileFilter,
});

const handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size allowed: ${
          env.MAX_FILE_SIZE || "10MB"
        }`,
      });
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Maximum 5 files allowed.",
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected file field.",
      });
    }
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
};

const validateUploadedFile = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  next();
};

const cleanupTempFiles = (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    const files = req.files || (req.file ? [req.file] : []);

    files.forEach((file) => {
      if (file && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (error) {
          console.error("Error cleaning up file:", error);
        }
      }
    });

    originalSend.call(this, data);
  };

  next();
};

const singleFileUpload = (fieldName = "file") => [
  upload.single(fieldName),
  handleUploadErrors,
  validateUploadedFile,
];

const multipleFileUpload = (fieldName = "files", maxCount = 5) => [
  upload.array(fieldName, maxCount),
  handleUploadErrors,
  validateUploadedFile,
];

const fieldsUpload = (fields) => [
  upload.fields(fields),
  handleUploadErrors,
  validateUploadedFile,
];

module.exports = {
  upload,
  handleUploadErrors,
  validateUploadedFile,
  cleanupTempFiles,
  singleFileUpload,
  multipleFileUpload,
  fieldsUpload,
};
