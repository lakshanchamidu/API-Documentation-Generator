const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2"); // ✅ add this

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: [2, "Project name must be at least 2 characters"],
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project owner is required"],
    },
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["viewer", "editor", "admin"],
          default: "editor",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    baseUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message:
          "Base URL must be a valid URL starting with http:// or https://",
      },
    },
    version: {
      type: String,
      default: "1.0.0",
      match: [
        /^\d+\.\d+\.\d+$/,
        "Version must follow semantic versioning (e.g., 1.0.0)",
      ],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    customDomain: {
      type: String,
      trim: true,
      sparse: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(
            v
          );
        },
        message: "Custom domain must be a valid domain name",
      },
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    settings: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "light",
      },
      logo: {
        type: String,
        default: null,
      },
      favicon: {
        type: String,
        default: null,
      },
      customCSS: {
        type: String,
        default: null,
      },
    },
    analytics: {
      views: {
        type: Number,
        default: 0,
      },
      lastViewed: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ owner: 1, name: 1 });
projectSchema.index({ "collaborators.user": 1 });
projectSchema.index({ isPublic: 1, status: 1 });

projectSchema.virtual("endpointCount", {
  ref: "Endpoint",
  localField: "_id",
  foreignField: "projectId",
  count: true,
});

projectSchema.methods.hasAccess = function (userId, requiredRole = "viewer") {
  if (this.owner.toString() === userId.toString()) {
    return true;
  }

  const collaborator = this.collaborators.find(
    (collab) => collab.user.toString() === userId.toString()
  );

  if (collaborator) {
    const roleHierarchy = ["viewer", "editor", "admin"];
    const userRoleIndex = roleHierarchy.indexOf(collaborator.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    return userRoleIndex >= requiredRoleIndex;
  }

  return this.isPublic && requiredRole === "viewer";
};

projectSchema.statics.findAccessibleByUser = function (userId) {
  return this.find({
    $or: [
      { owner: userId },
      { "collaborators.user": userId },
      { isPublic: true, status: "published" },
    ],
  })
    .populate("owner", "name email avatar")
    .populate("collaborators.user", "name email avatar");
};

// ✅ Add pagination plugin
projectSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Project", projectSchema);
