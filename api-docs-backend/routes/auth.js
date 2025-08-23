const express = require("express");
const { auth } = require("../controllers");
const {
  auth: authMiddleware,
  validation,
  rateLimit,
} = require("../middleware");

const router = express.Router();

// Public routes
router.post(
  "/register",
  rateLimit.auth,
  validation.validateRegister,
  auth.register
);

router.post("/login", rateLimit.auth, validation.validateLogin, auth.login);

// Protected routes
router.use(authMiddleware);

router.get("/profile", auth.getProfile);
router.put("/profile", auth.updateProfile);
router.put("/change-password", auth.changePassword);
router.get("/stats", auth.getUserStats);

module.exports = router;
