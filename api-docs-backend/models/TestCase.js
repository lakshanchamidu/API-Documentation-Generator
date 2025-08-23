const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema(
  {
    endpointId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Endpoint",
      required: [true, "Endpoint ID is required"],
    },
    name: {
      type: String,
      required: [true, "Test case name is required"],
      trim: true,
      maxlength: [100, "Test case name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    environment: {
      type: String,
      enum: ["development", "staging", "production", "custom"],
      default: "development",
    },
    request: {
      headers: {
        type: Map,
        of: String,
        default: new Map(),
      },
      queryParams: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map(),
      },
      pathParams: {
        type: Map,
        of: String,
        default: new Map(),
      },
      body: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
    expectedResponse: {
      statusCode: {
        type: Number,
        min: [100, "Status code must be at least 100"],
        max: [599, "Status code must be at most 599"],
      },
      headers: {
        type: Map,
        of: String,
      },
      body: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
    lastRun: {
      type: Date,
      default: null,
    },
    lastResult: {
      status: {
        type: String,
        enum: ["passed", "failed", "error", "not_run"],
        default: "not_run",
      },
      actualResponse: {
        statusCode: Number,
        headers: {
          type: Map,
          of: String,
        },
        body: mongoose.Schema.Types.Mixed,
        responseTime: Number,
      },
      errors: [String],
      runAt: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

testCaseSchema.index({ endpointId: 1 });
testCaseSchema.index({ "lastResult.status": 1 });

testCaseSchema.methods.run = async function () {
  console.log(`Running test case: ${this.name}`);

  try {
    this.lastRun = new Date();

    this.lastResult = {
      status: "passed",
      runAt: new Date(),
      actualResponse: {
        statusCode: 200,
        responseTime: Math.floor(Math.random() * 1000) + 100,
      },
      errors: [],
    };

    await this.save();
    return this.lastResult;
  } catch (error) {
    this.lastResult = {
      status: "error",
      runAt: new Date(),
      errors: [error.message],
    };
    await this.save();
    throw error;
  }
};

testCaseSchema.statics.getTestStats = function (endpointId) {
  return this.aggregate([
    { $match: { endpointId: mongoose.Types.ObjectId(endpointId) } },
    {
      $group: {
        _id: "$lastResult.status",
        count: { $sum: 1 },
      },
    },
  ]);
};

module.exports = mongoose.model("TestCase", testCaseSchema);
