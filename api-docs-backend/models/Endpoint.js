const mongoose = require("mongoose");

const headerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Header name is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Header type is required"],
      enum: ["string", "number", "boolean", "array", "object"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Header description cannot exceed 200 characters"],
    },
    example: mongoose.Schema.Types.Mixed,
  },
  { _id: false } // prevent _id for each header
);

const responseSchema = new mongoose.Schema({
  statusCode: {
    type: Number,
    required: [true, "Status code is required"],
    min: [100, "Status code must be at least 100"],
    max: [599, "Status code must be at most 599"],
  },
  description: {
    type: String,
    required: [true, "Response description is required"],
    trim: true,
    maxlength: [200, "Response description cannot exceed 200 characters"],
  },
  headers: {
    type: [headerSchema], // ✅ sub-schema use karanawa
    default: [],
  },
  schema: mongoose.Schema.Types.Mixed,
  example: mongoose.Schema.Types.Mixed,
});

const endpointSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project ID is required"],
    },
    method: {
      type: String,
      required: [true, "HTTP method is required"],
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
      uppercase: true,
    },
    path: {
      type: String,
      required: [true, "Endpoint path is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^\/.*/.test(v);
        },
        message: "Path must start with /",
      },
    },
    summary: {
      type: String,
      required: [true, "Endpoint summary is required"],
      trim: true,
      maxlength: [100, "Summary cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    operationId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    parameters: [
      /* same parameterSchema */
    ],
    requestBody: {
      /* same requestBody schema */
    },
    responses: {
      type: [responseSchema],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "At least one response is required",
      },
    },
    tags: [{ type: String, trim: true, maxlength: 30 }],
    deprecated: { type: Boolean, default: false },
    security: [
      /* same as before */
    ],
    externalDocs: {
      /* same as before */
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

endpointSchema.index({ projectId: 1, method: 1, path: 1 }, { unique: true });
endpointSchema.index({ projectId: 1, order: 1 });
endpointSchema.index({ tags: 1 });

endpointSchema.virtual("fullPath").get(function () {
  return `${this.method} ${this.path}`;
});

endpointSchema.methods.generateOperationId = function () {
  const cleanPath = this.path.replace(/[^a-zA-Z0-9]/g, "");
  return `${this.method.toLowerCase()}${cleanPath}`;
};

endpointSchema.pre("save", function (next) {
  if (!this.operationId) {
    this.operationId = this.generateOperationId();
  }
  next();
});

endpointSchema.statics.findByProjectAndMethod = function (projectId, method) {
  return this.find({ projectId, method: method.toUpperCase() }).sort({
    order: 1,
    path: 1,
  });
};

module.exports = mongoose.model("Endpoint", endpointSchema);
