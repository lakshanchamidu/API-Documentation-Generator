// routes/tests.js
const express = require("express");
const { test } = require("../controllers");
const { auth, validation, rateLimit } = require("../middleware");

const router = express.Router();

// All routes require authentication
router.use(auth);

// Test case routes for a specific endpoint
router.get(
  "/endpoint/:endpointId",
  validation.validateObjectId("endpointId"),
  validation.validatePagination,
  test.getTestCases
);

router.post(
  "/endpoint/:endpointId",
  validation.validateObjectId("endpointId"),
  rateLimit.subscriptionBased,
  validation.validateTestCase,
  test.createTestCase
);

router.post(
  "/endpoint/:endpointId/run-all",
  validation.validateObjectId("endpointId"),
  rateLimit.apiTest,
  test.runAllTestCases
);

// Individual test case operations
router.get("/:id", validation.validateObjectId("id"), test.getTestCase);

router.put(
  "/:id",
  validation.validateObjectId("id"),
  validation.validateTestCase,
  test.updateTestCase
);

router.delete("/:id", validation.validateObjectId("id"), test.deleteTestCase);

router.post(
  "/:id/run",
  validation.validateObjectId("id"),
  rateLimit.apiTest,
  test.runTestCase
);

router.get(
  "/:id/history",
  validation.validateObjectId("id"),
  validation.validatePagination,
  test.getTestHistory
);

module.exports = router;
