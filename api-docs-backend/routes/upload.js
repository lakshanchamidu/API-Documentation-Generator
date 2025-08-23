// routes/upload.js
const express = require("express");
const {
  auth,
  validation,
  rateLimit,
  upload,
  errors: { catchAsync, AppError },
} = require("../middleware");
const { Project, Endpoint } = require("../models");

const router = express.Router();

// All routes require authentication
router.use(auth);

// Import from Postman collection
router.post(
  "/postman/:projectId",
  validation.validateObjectId("projectId"),
  rateLimit.upload,
  upload.single("file"),
  catchAsync(async (req, res) => {
    const { projectId } = req.params;
    const file = req.file;

    if (!file) {
      throw new AppError("No file uploaded", 400);
    }

    // Verify project access
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    if (!project.hasAccess(req.userId, "editor")) {
      throw new AppError("Insufficient permissions", 403);
    }

    try {
      // Read and parse Postman collection
      const fs = require("fs");
      const fileContent = fs.readFileSync(file.path, "utf8");
      const collection = JSON.parse(fileContent);

      if (!collection.info || !collection.item) {
        throw new AppError("Invalid Postman collection format", 400);
      }

      const importedEndpoints = [];

      // Parse collection items recursively
      const parseItems = (items, folderPath = "") => {
        items.forEach((item) => {
          if (item.item) {
            // This is a folder, recurse
            parseItems(
              item.item,
              folderPath ? `${folderPath}/${item.name}` : item.name
            );
          } else if (item.request) {
            // This is a request
            const request = item.request;
            const method = request.method?.toUpperCase() || "GET";
            const url =
              typeof request.url === "string"
                ? request.url
                : request.url?.raw || "";

            // Extract path from URL
            let path = url;
            try {
              const urlObj = new URL(url);
              path = urlObj.pathname;
            } catch (e) {
              // If URL parsing fails, try to extract path
              const pathMatch = url.match(/^(?:https?:\/\/[^\/]+)?(\/.*)$/);
              path = pathMatch ? pathMatch[1] : `/${url}`;
            }

            if (!path.startsWith("/")) {
              path = "/" + path;
            }

            // Build endpoint object
            const endpointData = {
              projectId,
              method,
              path,
              summary: item.name || `${method} ${path}`,
              description: item.request.description || "",
              tags: folderPath ? [folderPath] : [],
              parameters: [],
              responses: [
                {
                  statusCode: 200,
                  description: "Successful response",
                },
              ],
            };

            // Parse parameters from URL
            if (
              request.url &&
              typeof request.url === "object" &&
              request.url.query
            ) {
              request.url.query.forEach((param) => {
                if (param.key) {
                  endpointData.parameters.push({
                    name: param.key,
                    type: "string",
                    in: "query",
                    required: false,
                    description: param.description || "",
                    example: param.value,
                  });
                }
              });
            }

            // Parse headers
            if (request.header) {
              request.header.forEach((header) => {
                if (
                  header.key &&
                  !["authorization", "content-type"].includes(
                    header.key.toLowerCase()
                  )
                ) {
                  endpointData.parameters.push({
                    name: header.key,
                    type: "string",
                    in: "header",
                    required: false,
                    description: header.description || "",
                    example: header.value,
                  });
                }
              });
            }

            // Parse request body
            if (request.body && ["POST", "PUT", "PATCH"].includes(method)) {
              let contentType = "application/json";
              let bodyExample = null;

              if (request.body.mode === "raw") {
                try {
                  bodyExample = JSON.parse(request.body.raw);
                } catch (e) {
                  bodyExample = request.body.raw;
                  contentType = "text/plain";
                }
              } else if (request.body.mode === "formdata") {
                contentType = "multipart/form-data";
                bodyExample = {};
                request.body.formdata?.forEach((param) => {
                  if (param.key) {
                    bodyExample[param.key] = param.value || param.src;
                  }
                });
              } else if (request.body.mode === "urlencoded") {
                contentType = "application/x-www-form-urlencoded";
                bodyExample = {};
                request.body.urlencoded?.forEach((param) => {
                  if (param.key) {
                    bodyExample[param.key] = param.value;
                  }
                });
              }

              endpointData.requestBody = {
                contentType,
                required: true,
                example: bodyExample,
              };
            }

            importedEndpoints.push(endpointData);
          }
        });
      };

      parseItems(collection.item);

      // Save endpoints to database
      const savedEndpoints = [];
      for (const endpointData of importedEndpoints) {
        try {
          // Check if endpoint already exists
          const existingEndpoint = await Endpoint.findOne({
            projectId,
            method: endpointData.method,
            path: endpointData.path,
          });

          if (!existingEndpoint) {
            const endpoint = new Endpoint(endpointData);
            await endpoint.save();
            savedEndpoints.push(endpoint);
          }
        } catch (error) {
          console.error("Error saving endpoint:", error);
          // Continue with other endpoints
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(file.path);

      res.json({
        success: true,
        message: "Postman collection imported successfully",
        data: {
          collectionName: collection.info.name,
          totalItems: importedEndpoints.length,
          importedEndpoints: savedEndpoints.length,
          skippedDuplicates: importedEndpoints.length - savedEndpoints.length,
          endpoints: savedEndpoints.map((ep) => ({
            id: ep._id,
            method: ep.method,
            path: ep.path,
            summary: ep.summary,
          })),
        },
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (file && file.path) {
        const fs = require("fs");
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        "Failed to parse Postman collection: " + error.message,
        400
      );
    }
  })
);

// Import from OpenAPI/Swagger spec
router.post(
  "/openapi/:projectId",
  validation.validateObjectId("projectId"),
  rateLimit.upload,
  upload.single("file"),
  catchAsync(async (req, res) => {
    const { projectId } = req.params;
    const file = req.file;

    if (!file) {
      throw new AppError("No file uploaded", 400);
    }

    // Verify project access
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    if (!project.hasAccess(req.userId, "editor")) {
      throw new AppError("Insufficient permissions", 403);
    }

    try {
      // Read and parse OpenAPI spec
      const fs = require("fs");
      const yaml = require("js-yaml");
      const fileContent = fs.readFileSync(file.path, "utf8");

      let spec;
      try {
        // Try JSON first
        spec = JSON.parse(fileContent);
      } catch (jsonError) {
        try {
          // Try YAML
          spec = yaml.load(fileContent);
        } catch (yamlError) {
          throw new AppError("Invalid JSON or YAML format", 400);
        }
      }

      if (!spec.paths) {
        throw new AppError("Invalid OpenAPI specification: missing paths", 400);
      }

      // Update project info if available
      if (spec.info) {
        const updateData = {};
        if (spec.info.title) updateData.name = spec.info.title;
        if (spec.info.description)
          updateData.description = spec.info.description;
        if (spec.info.version) updateData.version = spec.info.version;

        if (spec.servers && spec.servers[0] && spec.servers[0].url) {
          updateData.baseUrl = spec.servers[0].url;
        }

        if (Object.keys(updateData).length > 0) {
          await Project.findByIdAndUpdate(projectId, updateData);
        }
      }

      const importedEndpoints = [];

      // Parse paths
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        for (const [method, operation] of Object.entries(pathItem)) {
          if (
            ![
              "get",
              "post",
              "put",
              "delete",
              "patch",
              "head",
              "options",
            ].includes(method)
          ) {
            continue;
          }

          const endpointData = {
            projectId,
            method: method.toUpperCase(),
            path,
            summary: operation.summary || `${method.toUpperCase()} ${path}`,
            description: operation.description || "",
            operationId: operation.operationId,
            tags: operation.tags || [],
            deprecated: operation.deprecated || false,
            parameters: [],
            responses: [],
          };

          // Parse parameters
          if (operation.parameters) {
            operation.parameters.forEach((param) => {
              endpointData.parameters.push({
                name: param.name,
                type: param.schema?.type || "string",
                in: param.in,
                required: param.required || false,
                description: param.description || "",
                example: param.example || param.schema?.example,
              });
            });
          }

          // Parse request body
          if (operation.requestBody) {
            const contentTypes = Object.keys(
              operation.requestBody.content || {}
            );
            const contentType = contentTypes[0] || "application/json";
            const content = operation.requestBody.content[contentType];

            endpointData.requestBody = {
              contentType,
              required: operation.requestBody.required || false,
              description: operation.requestBody.description || "",
              schema: content?.schema,
              example: content?.example || content?.examples?.default?.value,
            };
          }

          // Parse responses
          if (operation.responses) {
            for (const [statusCode, response] of Object.entries(
              operation.responses
            )) {
              const responseData = {
                statusCode: parseInt(statusCode) || 200,
                description: response.description || "",
                schema: null,
                example: null,
              };

              if (response.content) {
                const contentTypes = Object.keys(response.content);
                const contentType = contentTypes[0];
                if (contentType && response.content[contentType]) {
                  responseData.schema = response.content[contentType].schema;
                  responseData.example =
                    response.content[contentType].example ||
                    response.content[contentType].examples?.default?.value;
                }
              }

              endpointData.responses.push(responseData);
            }
          }

          // Ensure at least one response
          if (endpointData.responses.length === 0) {
            endpointData.responses.push({
              statusCode: 200,
              description: "Successful response",
            });
          }

          importedEndpoints.push(endpointData);
        }
      }

      // Save endpoints to database
      const savedEndpoints = [];
      for (const endpointData of importedEndpoints) {
        try {
          // Check if endpoint already exists
          const existingEndpoint = await Endpoint.findOne({
            projectId,
            method: endpointData.method,
            path: endpointData.path,
          });

          if (!existingEndpoint) {
            const endpoint = new Endpoint(endpointData);
            await endpoint.save();
            savedEndpoints.push(endpoint);
          }
        } catch (error) {
          console.error("Error saving endpoint:", error);
          // Continue with other endpoints
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(file.path);

      res.json({
        success: true,
        message: "OpenAPI specification imported successfully",
        data: {
          specTitle: spec.info?.title || "Untitled API",
          totalEndpoints: importedEndpoints.length,
          importedEndpoints: savedEndpoints.length,
          skippedDuplicates: importedEndpoints.length - savedEndpoints.length,
          endpoints: savedEndpoints.map((ep) => ({
            id: ep._id,
            method: ep.method,
            path: ep.path,
            summary: ep.summary,
          })),
        },
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (file && file.path) {
        const fs = require("fs");
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        "Failed to parse OpenAPI specification: " + error.message,
        400
      );
    }
  })
);

module.exports = router;
