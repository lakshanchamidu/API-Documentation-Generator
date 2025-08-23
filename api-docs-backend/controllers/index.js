const authController = require("./authController");
const projectController = require("./projectController");
const endpointController = require("./endpointController");
const testController = require("./testController");
const documentationController = require("./documentationController");

module.exports = {
  auth: authController,
  project: projectController,
  endpoint: endpointController,
  test: testController,
  documentation: documentationController,
};
