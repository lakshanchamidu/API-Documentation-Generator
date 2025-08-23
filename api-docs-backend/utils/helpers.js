// utils/helpers.js

/**
 * Format response object with consistent structure
 */
const formatResponse = (success, message, data = null, meta = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString(),
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return response;
};

/**
 * Generate random string for various purposes
 */
const generateRandomString = (length = 10, options = {}) => {
  const {
    includeNumbers = true,
    includeUppercase = true,
    includeLowercase = true,
    includeSymbols = false,
  } = options;

  let chars = "";
  if (includeLowercase) chars += "abcdefghijklmnopqrstuvwxyz";
  if (includeUppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (includeNumbers) chars += "0123456789";
  if (includeSymbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Sanitize filename for safe file operations
 */
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
};

/**
 * Convert string to slug format
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

/**
 * Parse MongoDB sort string
 */
const parseSortString = (sortString) => {
  if (!sortString) return {};

  const sortObject = {};
  const fields = sortString.split(",");

  fields.forEach((field) => {
    const trimmedField = field.trim();
    if (trimmedField.startsWith("-")) {
      sortObject[trimmedField.substring(1)] = -1;
    } else {
      sortObject[trimmedField] = 1;
    }
  });

  return sortObject;
};

/**
 * Calculate pagination info
 */
const calculatePagination = (page, limit, total) => {
  const currentPage = parseInt(page) || 1;
  const perPage = parseInt(limit) || 10;
  const totalPages = Math.ceil(total / perPage);
  const skip = (currentPage - 1) * perPage;

  return {
    currentPage,
    perPage,
    totalPages,
    totalItems: total,
    skip,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null,
  };
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Format file size in human readable format
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Deep clone object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item));
  }

  if (typeof obj === "object") {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Remove undefined/null values from object
 */
const cleanObject = (obj) => {
  const cleaned = {};

  for (const key in obj) {
    if (obj[key] !== undefined && obj[key] !== null) {
      if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
        const cleanedNested = cleanObject(obj[key]);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = obj[key];
      }
    }
  }

  return cleaned;
};

/**
 * Generate API key
 */
const generateApiKey = (prefix = "api") => {
  const timestamp = Date.now().toString(36);
  const randomPart = generateRandomString(16, {
    includeNumbers: true,
    includeUppercase: true,
    includeLowercase: true,
  });
  return `${prefix}_${timestamp}_${randomPart}`;
};

/**
 * Escape HTML special characters
 */
const escapeHtml = (text) => {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, (m) => map[m]);
};

/**
 * Generate password strength score
 */
const getPasswordStrength = (password) => {
  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  const strength = [
    "Very Weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
    "Very Strong",
  ];
  return {
    score: score,
    strength: strength[Math.min(score, 5)],
  };
};

/**
 * Retry function with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

/**
 * Debounce function
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 */
const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

module.exports = {
  formatResponse,
  generateRandomString,
  sanitizeFilename,
  slugify,
  parseSortString,
  calculatePagination,
  isValidEmail,
  isValidUrl,
  formatFileSize,
  deepClone,
  cleanObject,
  generateApiKey,
  escapeHtml,
  getPasswordStrength,
  retryWithBackoff,
  debounce,
  throttle,
};
