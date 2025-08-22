const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minLength: [2, "Name must be at least 2 characters."],
      maxLenght: [50, "Name cannot exceed 50 characters."],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required."],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      minLength: [6, "Password must be at least 6 characters."],
    },
    avatar: {
      type: String,
      default: null,
    },
    subscription: {
      type: String,
      enum: ["free", "pro", "enterprises"],
      default: "free",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

userSchema.methods.getPublicProfile = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

userSchema.methods.findByEmail = function (email) {
  return this.findOne({ email: email.toLoweCase() });
};

module.exports = mongoose.model("User", userSchema);
