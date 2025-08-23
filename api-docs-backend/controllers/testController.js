// controllers/testController.js
const { TestCase, Endpoint, Project } = require("../models");
const {
  errors: { catchAsync, AppError },
} = require("../middleware");
const axios = require("axios");

const getTestCases = catchAsync(async (req, res) => {
  const { endpointId } = req.params;
  const { status, environment } = req.query;

  // Verify endpoint access
  const endpoint = await Endpoint.findById(endpointId).populate("projectId");
  if (!endpoint) {
    throw new AppError("Endpoint not found", 404);
  }

  if (!endpoint.projectId.hasAccess(req.userId)) {
    throw new AppError("Access denied", 403);
  }

  // Build query
  let query = { endpointId };

  if (status) {
    query["lastResult.status"] = status;
  }

  if (environment) {
    query.environment = environment;
  }

  const testCases = await TestCase.find(query).sort({ createdAt: -1 });

  res.json({
    success: true,
    message: "Test cases retrieved successfully",
    data: {
      testCases,
      statistics: {
        total: testCases.length,
        byStatus: testCases.reduce((acc, test) => {
          const status = test.lastResult.status;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}),
        byEnvironment: testCases.reduce((acc, test) => {
          acc[test.environment] = (acc[test.environment] || 0) + 1;
          return acc;
        }, {}),
      },
    },
  });
});

const getTestCase = catchAsync(async (req, res) => {
  const { id } = req.params;

  const testCase = await TestCase.findById(id).populate({
    path: "endpointId",
    populate: {
      path: "projectId",
    },
  });

  if (!testCase) {
    throw new AppError("Test case not found", 404);
  }

  // Check project access
  if (!testCase.endpointId.projectId.hasAccess(req.userId)) {
    throw new AppError("Access denied", 403);
  }

  res.json({
    success: true,
    message: "Test case retrieved successfully",
    data: {
      testCase,
    },
  });
});

const createTestCase = catchAsync(async (req, res) => {
  const { endpointId } = req.params;
  const testData = req.body;

  // Verify endpoint access
  const endpoint = await Endpoint.findById(endpointId).populate("projectId");
  if (!endpoint) {
    throw new AppError("Endpoint not found", 404);
  }

  if (!endpoint.projectId.hasAccess(req.userId, "editor")) {
    throw new AppError("Insufficient permissions to create test cases", 403);
  }

  const testCase = new TestCase({
    ...testData,
    endpointId,
  });

  await testCase.save();

  res.status(201).json({
    success: true,
    message: "Test case created successfully",
    data: {
      testCase,
    },
  });
});

const updateTestCase = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const testCase = await TestCase.findById(id).populate({
    path: "endpointId",
    populate: {
      path: "projectId",
    },
  });

  if (!testCase) {
    throw new AppError("Test case not found", 404);
  }

  // Check project access
  if (!testCase.endpointId.projectId.hasAccess(req.userId, "editor")) {
    throw new AppError(
      "Insufficient permissions to update this test case",
      403
    );
  }

  const updatedTestCase = await TestCase.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    message: "Test case updated successfully",
    data: {
      testCase: updatedTestCase,
    },
  });
});

const deleteTestCase = catchAsync(async (req, res) => {
  const { id } = req.params;

  const testCase = await TestCase.findById(id).populate({
    path: "endpointId",
    populate: {
      path: "projectId",
    },
  });

  if (!testCase) {
    throw new AppError("Test case not found", 404);
  }

  // Check project access
  if (!testCase.endpointId.projectId.hasAccess(req.userId, "editor")) {
    throw new AppError(
      "Insufficient permissions to delete this test case",
      403
    );
  }

  await TestCase.findByIdAndDelete(id);

  res.json({
    success: true,
    message: "Test case deleted successfully",
  });
});

const runTestCase = catchAsync(async (req, res) => {
  const { id } = req.params;

  const testCase = await TestCase.findById(id).populate({
    path: "endpointId",
    populate: {
      path: "projectId",
    },
  });

  if (!testCase) {
    throw new AppError("Test case not found", 404);
  }

  // Check project access
  if (!testCase.endpointId.projectId.hasAccess(req.userId)) {
    throw new AppError("Access denied", 403);
  }

  const endpoint = testCase.endpointId;
  const project = endpoint.projectId;

  try {
    // Build request URL
    const baseUrl = project.baseUrl || "https://api.example.com";
    let url = `${baseUrl}${endpoint.path}`;

    // Replace path parameters
    if (testCase.request.pathParams) {
      for (const [key, value] of testCase.request.pathParams) {
        url = url.replace(`{${key}}`, encodeURIComponent(value));
      }
    }

    // Build request config
    const requestConfig = {
      method: endpoint.method.toLowerCase(),
      url,
      timeout: 30000,
      validateStatus: () => true, // Don't throw on any status code
    };

    // Add headers
    if (testCase.request.headers && testCase.request.headers.size > 0) {
      requestConfig.headers = Object.fromEntries(testCase.request.headers);
    }

    // Add query parameters
    if (testCase.request.queryParams && testCase.request.queryParams.size > 0) {
      requestConfig.params = Object.fromEntries(testCase.request.queryParams);
    }

    // Add request body
    if (
      testCase.request.body &&
      ["POST", "PUT", "PATCH"].includes(endpoint.method)
    ) {
      requestConfig.data = testCase.request.body;
    }

    // Make the request
    const startTime = Date.now();
    const response = await axios(requestConfig);
    const responseTime = Date.now() - startTime;

    // Analyze response
    const actualResponse = {
      statusCode: response.status,
      headers: new Map(Object.entries(response.headers)),
      body: response.data,
      responseTime,
    };

    // Check if test passed
    let status = "passed";
    const errors = [];

    // Check status code
    if (
      testCase.expectedResponse.statusCode &&
      testCase.expectedResponse.statusCode !== actualResponse.statusCode
    ) {
      status = "failed";
      errors.push(
        `Expected status code ${testCase.expectedResponse.statusCode}, got ${actualResponse.statusCode}`
      );
    }

    // Check response headers
    if (testCase.expectedResponse.headers) {
      for (const [key, expectedValue] of testCase.expectedResponse.headers) {
        const actualValue = actualResponse.headers.get(key.toLowerCase());
        if (actualValue !== expectedValue) {
          status = "failed";
          errors.push(
            `Expected header ${key}: ${expectedValue}, got: ${
              actualValue || "undefined"
            }`
          );
        }
      }
    }

    // Basic body validation (can be enhanced)
    if (
      testCase.expectedResponse.body &&
      JSON.stringify(testCase.expectedResponse.body) !==
        JSON.stringify(actualResponse.body)
    ) {
      // For now, just check if both are objects/arrays or exact matches
      if (
        typeof testCase.expectedResponse.body !== typeof actualResponse.body
      ) {
        status = "failed";
        errors.push("Response body type mismatch");
      }
    }

    // Update test case with results
    testCase.lastRun = new Date();
    testCase.lastResult = {
      status,
      actualResponse,
      errors,
      runAt: new Date(),
    };

    await testCase.save();

    res.json({
      success: true,
      message: "Test case executed successfully",
      data: {
        testCase,
        result: {
          status,
          responseTime,
          errors,
          passed: status === "passed",
        },
      },
    });
  } catch (error) {
    // Handle request errors
    testCase.lastRun = new Date();
    testCase.lastResult = {
      status: "error",
      errors: [error.message],
      runAt: new Date(),
    };

    await testCase.save();

    res.json({
      success: true,
      message: "Test case executed with errors",
      data: {
        testCase,
        result: {
          status: "error",
          errors: [error.message],
          passed: false,
        },
      },
    });
  }
});

const runAllTestCases = catchAsync(async (req, res) => {
  const { endpointId } = req.params;

  // Verify endpoint access
  const endpoint = await Endpoint.findById(endpointId).populate("projectId");
  if (!endpoint) {
    throw new AppError("Endpoint not found", 404);
  }

  if (!endpoint.projectId.hasAccess(req.userId)) {
    throw new AppError("Access denied", 403);
  }

  const testCases = await TestCase.find({
    endpointId,
    isActive: true,
  });

  if (testCases.length === 0) {
    return res.json({
      success: true,
      message: "No active test cases found",
      data: {
        results: [],
        summary: {
          total: 0,
          passed: 0,
          failed: 0,
          errors: 0,
        },
      },
    });
  }

  const results = [];
  let passed = 0,
    failed = 0,
    errors = 0;

  // Run each test case (in sequence to avoid overwhelming the API)
  for (const testCase of testCases) {
    try {
      // Execute test logic (similar to runTestCase but simplified)
      await testCase.run(); // Using the model method

      const result = {
        testCaseId: testCase._id,
        name: testCase.name,
        status: testCase.lastResult.status,
        responseTime: testCase.lastResult.actualResponse?.responseTime,
        errors: testCase.lastResult.errors,
      };

      results.push(result);

      // Update counters
      if (result.status === "passed") passed++;
      else if (result.status === "failed") failed++;
      else errors++;
    } catch (error) {
      errors++;
      results.push({
        testCaseId: testCase._id,
        name: testCase.name,
        status: "error",
        errors: [error.message],
      });
    }

    // Add small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  res.json({
    success: true,
    message: "All test cases executed",
    data: {
      results,
      summary: {
        total: testCases.length,
        passed,
        failed,
        errors,
        successRate: ((passed / testCases.length) * 100).toFixed(2),
      },
    },
  });
});

const getTestHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { limit = 10 } = req.query;

  const testCase = await TestCase.findById(id).populate({
    path: "endpointId",
    populate: {
      path: "projectId",
    },
  });

  if (!testCase) {
    throw new AppError("Test case not found", 404);
  }

  // Check project access
  if (!testCase.endpointId.projectId.hasAccess(req.userId)) {
    throw new AppError("Access denied", 403);
  }

  // For now, return the last result (can be enhanced to store full history)
  const history = testCase.lastResult ? [testCase.lastResult] : [];

  res.json({
    success: true,
    message: "Test history retrieved successfully",
    data: {
      testCase: {
        id: testCase._id,
        name: testCase.name,
      },
      history: history.slice(0, parseInt(limit)),
    },
  });
});

module.exports = {
  getTestCases,
  getTestCase,
  createTestCase,
  updateTestCase,
  deleteTestCase,
  runTestCase,
  runAllTestCases,
  getTestHistory,
};
