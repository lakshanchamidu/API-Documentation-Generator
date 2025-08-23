const jwt = require("jsonwebtoken");

const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || "fallback-development-secret-key",
  expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  issuer: process.env.JWT_ISSUER || "api-docs-generator",
  audience: process.env.JWT_AUDIENCE || "api-docs-users",
};

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    });
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

const decodeToken = (token) => {
  return jwt.decode(token);
};

const refreshToken = (oldToken) => {
  try {
    const decoded = verifyToken(oldToken);

    delete decoded.iat;
    delete decoded.exp;
    delete decoded.iss;
    delete decoded.aud;

    return generateToken(decoded);
  } catch (error) {
    throw new Error("Cannot refresh invalid token");
  }
};

const getTokenExpiry = (token) => {
  try {
    const decoded = decodeToken(token);
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

module.exports = {
  JWT_CONFIG,
  generateToken,
  verifyToken,
  decodeToken,
  refreshToken,
  getTokenExpiry,
};
