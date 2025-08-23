// controllers/authController.js
const { User } = require("../models");
const { jwt } = require("../config");
const {
  errors: { catchAsync, AppError },
} = require("../middleware");

const generateTokenResponse = (user) => {
  const token = jwt.generateToken({
    userId: user._id,
    email: user.email,
  });

  return {
    token,
    user: user.getPublicProfile(),
  };
};

const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new AppError("User with this email already exists", 400);
  }

  // Create new user
  const user = new User({
    name,
    email,
    password,
  });

  await user.save();

  // Generate token and send response
  const tokenResponse = generateTokenResponse(user);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: tokenResponse,
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findByEmail(email).select("+password");
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError("Account is deactivated. Please contact support.", 401);
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token and send response
  const tokenResponse = generateTokenResponse(user);

  res.json({
    success: true,
    message: "Login successful",
    data: tokenResponse,
  });
});

const getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({
    success: true,
    message: "Profile retrieved successfully",
    data: {
      user: user.getPublicProfile(),
    },
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const { name, avatar } = req.body;

  // Don't allow updating sensitive fields
  const allowedUpdates = { name, avatar };
  Object.keys(allowedUpdates).forEach(
    (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key]
  );

  const user = await User.findByIdAndUpdate(req.userId, allowedUpdates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user: user.getPublicProfile(),
    },
  });
});

const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.userId).select("+password");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AppError("Current password is incorrect", 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: "Password changed successfully",
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError("Refresh token is required", 400);
  }

  try {
    // Verify and refresh token
    const newToken = jwt.refreshToken(token);

    // Get user details
    const decoded = jwt.verifyToken(newToken);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw new AppError("Invalid refresh token", 401);
    }

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        token: newToken,
        user: user.getPublicProfile(),
      },
    });
  } catch (error) {
    throw new AppError("Invalid refresh token", 401);
  }
});

const deactivateAccount = catchAsync(async (req, res) => {
  const { password } = req.body;

  // Get user with password
  const user = await User.findById(req.userId).select("+password");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError("Password is incorrect", 400);
  }

  // Deactivate account
  user.isActive = false;
  await user.save();

  res.json({
    success: true,
    message: "Account deactivated successfully",
  });
});

const getUserStats = catchAsync(async (req, res) => {
  const { Project, Endpoint } = require("../models");

  const [projectCount, endpointCount] = await Promise.all([
    Project.countDocuments({ owner: req.userId }),
    Endpoint.countDocuments({
      projectId: {
        $in: await Project.find({ owner: req.userId }).distinct("_id"),
      },
    }),
  ]);

  const user = await User.findById(req.userId);

  res.json({
    success: true,
    message: "User statistics retrieved successfully",
    data: {
      user: user.getPublicProfile(),
      statistics: {
        projectCount,
        endpointCount,
        memberSince: user.createdAt,
        lastLogin: user.lastLogin,
      },
    },
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  deactivateAccount,
  getUserStats,
};
