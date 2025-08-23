// middleware/auth.js
const { jwt } = require("../config");
const { User } = require("../models");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verifyToken(token);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated.",
      });
    }

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token.",
      error: error.message,
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verifyToken(token);
      const user = await User.findById(decoded.userId).select("-password");

      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id.toString();
      }
    }

    next();
  } catch (error) {
    next();
  }
};

const requireSubscription = (requiredLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const subscriptionHierarchy = ["free", "pro", "enterprise"];
    const userLevel = subscriptionHierarchy.indexOf(req.user.subscription);
    const requiredLevelIndex = subscriptionHierarchy.indexOf(requiredLevel);

    if (userLevel < requiredLevelIndex) {
      return res.status(403).json({
        success: false,
        message: `${requiredLevel} subscription required.`,
        currentSubscription: req.user.subscription,
        requiredSubscription: requiredLevel,
      });
    }

    next();
  };
};

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.subscription !== "enterprise") {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }

  next();
};

module.exports = {
  auth,
  optionalAuth,
  requireSubscription,
  adminOnly,
};
