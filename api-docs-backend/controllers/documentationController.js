// controllers/documentationController.js
const { Project, Endpoint } = require("../models");
const {
  errors: { catchAsync, AppError },
} = require("../middleware");
const fs = require("fs").promises;
const path = require("path");

const generateOpenAPISpec = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { version = "3.0.0" } = req.query;

  // Get project with endpoints
  const project = await Project.findById(id);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Check access (public projects or user has access)
  if (!project.isPublic && !project.hasAccess(req.userId)) {
    throw new AppError("Access denied", 403);
  }

  const endpoints = await Endpoint.find({ projectId: id }).sort("order");

  // Build OpenAPI specification
  const openApiSpec = {
    openapi: version,
    info: {
      title: project.name,
      description:
        project.description || `API documentation for ${project.name}`,
      version: project.version || "1.0.0",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: project.baseUrl || "https://api.example.com",
        description: "Production server",
      },
    ],
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {},
    },
    tags: [],
  };

  // Get unique tags
  const allTags = [...new Set(endpoints.flatMap((ep) => ep.tags || []))];
  openApiSpec.tags = allTags.map((tag) => ({ name: tag }));

  // Process endpoints
  endpoints.forEach((endpoint) => {
    const pathKey = endpoint.path;
    const method = endpoint.method.toLowerCase();

    if (!openApiSpec.paths[pathKey]) {
      openApiSpec.paths[pathKey] = {};
    }

    // Build operation object
    const operation = {
      summary: endpoint.summary,
      description: endpoint.description,
      operationId: endpoint.operationId,
      tags: endpoint.tags || [],
      deprecated: endpoint.deprecated || false,
      parameters: [],
      responses: {},
    };

    // Add parameters
    if (endpoint.parameters && endpoint.parameters.length > 0) {
      endpoint.parameters.forEach((param) => {
        operation.parameters.push({
          name: param.name,
          in: param.in,
          required: param.required,
          description: param.description,
          schema: {
            type: param.type,
            example: param.example,
          },
        });
      });
    }

    // Add request body
    if (endpoint.requestBody && ["post", "put", "patch"].includes(method)) {
      operation.requestBody = {
        description: endpoint.requestBody.description,
        required: endpoint.requestBody.required,
        content: {
          [endpoint.requestBody.contentType]: {
            schema: endpoint.requestBody.schema || { type: "object" },
            example: endpoint.requestBody.example,
          },
        },
      };
    }

    // Add responses
    if (endpoint.responses && endpoint.responses.length > 0) {
      endpoint.responses.forEach((response) => {
        operation.responses[response.statusCode] = {
          description: response.description,
          content: {
            "application/json": {
              schema: response.schema || { type: "object" },
              example: response.example,
            },
          },
        };
      });
    } else {
      // Default response
      operation.responses["200"] = {
        description: "Successful response",
      };
    }

    // Add security if defined
    if (endpoint.security && endpoint.security.length > 0) {
      operation.security = endpoint.security.map((sec) => ({
        [sec.name]: [],
      }));
    }

    openApiSpec.paths[pathKey][method] = operation;
  });

  res.json({
    success: true,
    message: "OpenAPI specification generated successfully",
    data: {
      specification: openApiSpec,
      meta: {
        generatedAt: new Date().toISOString(),
        endpointCount: endpoints.length,
        version: version,
      },
    },
  });
});

const generateMarkdownDocs = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Get project with endpoints
  const project = await Project.findById(id);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Check access
  if (!project.isPublic && !project.hasAccess(req.userId)) {
    throw new AppError("Access denied", 403);
  }

  const endpoints = await Endpoint.find({ projectId: id }).sort("order");

  // Generate Markdown content
  let markdown = `# ${project.name}\n\n`;

  if (project.description) {
    markdown += `${project.description}\n\n`;
  }

  markdown += `**Version:** ${project.version || "1.0.0"}\n`;
  markdown += `**Base URL:** ${
    project.baseUrl || "https://api.example.com"
  }\n\n`;

  // Table of contents
  markdown += `## Table of Contents\n\n`;
  const groupedEndpoints = {};

  endpoints.forEach((endpoint) => {
    const tags =
      endpoint.tags && endpoint.tags.length > 0 ? endpoint.tags : ["General"];
    tags.forEach((tag) => {
      if (!groupedEndpoints[tag]) groupedEndpoints[tag] = [];
      groupedEndpoints[tag].push(endpoint);
    });
  });

  Object.keys(groupedEndpoints).forEach((tag) => {
    markdown += `- [${tag}](#${tag.toLowerCase().replace(/\s+/g, "-")})\n`;
    groupedEndpoints[tag].forEach((endpoint) => {
      markdown += `  - [${endpoint.method} ${
        endpoint.path
      }](#${endpoint.method.toLowerCase()}-${endpoint.path
        .replace(/[^a-zA-Z0-9]/g, "-")
        .toLowerCase()})\n`;
    });
  });

  markdown += `\n`;

  // Generate documentation for each group
  Object.keys(groupedEndpoints).forEach((tag) => {
    markdown += `## ${tag}\n\n`;

    groupedEndpoints[tag].forEach((endpoint) => {
      const methodColors = {
        GET: "🟢",
        POST: "🔵",
        PUT: "🟠",
        DELETE: "🔴",
        PATCH: "🟡",
      };

      markdown += `### ${methodColors[endpoint.method] || "⚪"} ${
        endpoint.method
      } ${endpoint.path}\n\n`;
      markdown += `${endpoint.summary}\n\n`;

      if (endpoint.description) {
        markdown += `${endpoint.description}\n\n`;
      }

      // Parameters
      if (endpoint.parameters && endpoint.parameters.length > 0) {
        markdown += `#### Parameters\n\n`;
        markdown += `| Name | Type | In | Required | Description |\n`;
        markdown += `|------|------|----|---------|--------------|\n`;

        endpoint.parameters.forEach((param) => {
          markdown += `| ${param.name} | ${param.type} | ${param.in} | ${
            param.required ? "Yes" : "No"
          } | ${param.description || "-"} |\n`;
        });
        markdown += `\n`;
      }

      // Request body
      if (
        endpoint.requestBody &&
        ["POST", "PUT", "PATCH"].includes(endpoint.method)
      ) {
        markdown += `#### Request Body\n\n`;
        markdown += `**Content Type:** ${endpoint.requestBody.contentType}\n\n`;

        if (endpoint.requestBody.example) {
          markdown += `**Example:**\n\n`;
          markdown += `\`\`\`json\n${JSON.stringify(
            endpoint.requestBody.example,
            null,
            2
          )}\n\`\`\`\n\n`;
        }
      }

      // Responses
      if (endpoint.responses && endpoint.responses.length > 0) {
        markdown += `#### Responses\n\n`;

        endpoint.responses.forEach((response) => {
          markdown += `**${response.statusCode}** - ${response.description}\n\n`;

          if (response.example) {
            markdown += `\`\`\`json\n${JSON.stringify(
              response.example,
              null,
              2
            )}\n\`\`\`\n\n`;
          }
        });
      }

      if (endpoint.deprecated) {
        markdown += `> ⚠️ **Deprecated:** This endpoint is deprecated and may be removed in future versions.\n\n`;
      }

      markdown += `---\n\n`;
    });
  });

  res.json({
    success: true,
    message: "Markdown documentation generated successfully",
    data: {
      markdown,
      meta: {
        generatedAt: new Date().toISOString(),
        endpointCount: endpoints.length,
        wordCount: markdown.split(" ").length,
      },
    },
  });
});

const generateHTML = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { theme = "default" } = req.query;

  // Get project with endpoints
  const project = await Project.findById(id);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  // Check access
  if (!project.isPublic && !project.hasAccess(req.userId)) {
    throw new AppError("Access denied", 403);
  }

  const endpoints = await Endpoint.find({ projectId: id }).sort("order");

  // Generate HTML content
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.name} - API Documentation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 2rem; margin-bottom: 2rem; }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header p { font-size: 1.1rem; opacity: 0.9; }
        .sidebar { position: fixed; left: 0; top: 0; width: 300px; height: 100vh; background: #f8f9fa; overflow-y: auto; padding: 1rem; }
        .content { margin-left: 320px; }
        .endpoint { margin-bottom: 3rem; padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 8px; }
        .method { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: bold; color: white; margin-right: 1rem; }
        .method.get { background: #10b981; }
        .method.post { background: #3b82f6; }
        .method.put { background: #f59e0b; }
        .method.delete { background: #ef4444; }
        .method.patch { background: #8b5cf6; }
        .code { background: #f3f4f6; padding: 1rem; border-radius: 4px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
    </style>
</head>
<body>
    <div class="sidebar">
        <h3>API Documentation</h3>
        <ul>
            ${endpoints
              .map(
                (ep) => `
                <li><a href="#${ep._id}">${ep.method} ${ep.path}</a></li>
            `
              )
              .join("")}
        </ul>
    </div>
    
    <div class="content">
        <div class="header">
            <h1>${project.name}</h1>
            <p>${project.description || "API Documentation"}</p>
            <p><strong>Version:</strong> ${project.version || "1.0.0"}</p>
            <p><strong>Base URL:</strong> ${
              project.baseUrl || "https://api.example.com"
            }</p>
        </div>
        
        <div class="container">
            ${endpoints
              .map(
                (endpoint) => `
                <div class="endpoint" id="${endpoint._id}">
                    <h2>
                        <span class="method ${endpoint.method.toLowerCase()}">${
                  endpoint.method
                }</span>
                        ${endpoint.path}
                    </h2>
                    <p><strong>${endpoint.summary}</strong></p>
                    ${
                      endpoint.description
                        ? `<p>${endpoint.description}</p>`
                        : ""
                    }
                    
                    ${
                      endpoint.parameters && endpoint.parameters.length > 0
                        ? `
                        <h3>Parameters</h3>
                        <table>
                            <thead>
                                <tr><th>Name</th><th>Type</th><th>In</th><th>Required</th><th>Description</th></tr>
                            </thead>
                            <tbody>
                                ${endpoint.parameters
                                  .map(
                                    (param) => `
                                    <tr>
                                        <td>${param.name}</td>
                                        <td>${param.type}</td>
                                        <td>${param.in}</td>
                                        <td>${
                                          param.required ? "Yes" : "No"
                                        }</td>
                                        <td>${param.description || "-"}</td>
                                    </tr>
                                `
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                    `
                        : ""
                    }
                    
                    ${
                      endpoint.responses && endpoint.responses.length > 0
                        ? `
                        <h3>Responses</h3>
                        ${endpoint.responses
                          .map(
                            (response) => `
                            <h4>${response.statusCode} - ${
                              response.description
                            }</h4>
                            ${
                              response.example
                                ? `
                                <pre class="code">${JSON.stringify(
                                  response.example,
                                  null,
                                  2
                                )}</pre>
                            `
                                : ""
                            }
                        `
                          )
                          .join("")}
                    `
                        : ""
                    }
                </div>
            `
              )
              .join("")}
        </div>
    </div>
</body>
</html>
  `;

  res.json({
    success: true,
    message: "HTML documentation generated successfully",
    data: {
      html,
      meta: {
        generatedAt: new Date().toISOString(),
        endpointCount: endpoints.length,
        theme: theme,
      },
    },
  });
});

const exportDocumentation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { format = "json", theme = "default" } = req.query;

  const project = await Project.findById(id);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (!project.isPublic && !project.hasAccess(req.userId)) {
    throw new AppError("Access denied", 403);
  }

  let contentType, filename, content;

  switch (format.toLowerCase()) {
    case "openapi":
    case "swagger":
      const endpoints = await Endpoint.find({ projectId: id }).sort("order");
      const openApiSpec = {
        openapi: "3.0.0",
        info: {
          title: project.name,
          description:
            project.description || `API documentation for ${project.name}`,
          version: project.version || "1.0.0",
        },
        servers: [{ url: project.baseUrl || "https://api.example.com" }],
        paths: {},
      };

      endpoints.forEach((endpoint) => {
        const pathKey = endpoint.path;
        const method = endpoint.method.toLowerCase();

        if (!openApiSpec.paths[pathKey]) {
          openApiSpec.paths[pathKey] = {};
        }

        openApiSpec.paths[pathKey][method] = {
          summary: endpoint.summary,
          description: endpoint.description,
          responses: endpoint.responses.reduce((acc, res) => {
            acc[res.statusCode] = { description: res.description };
            return acc;
          }, {}),
        };
      });

      content = JSON.stringify(openApiSpec, null, 2);
      contentType = "application/json";
      filename = `${project.name
        .replace(/\s+/g, "-")
        .toLowerCase()}-openapi.json`;
      break;

    case "markdown":
    case "md":
      const markdownResult = await generateMarkdownDocs(req, res);
      content = markdownResult.data.markdown;
      contentType = "text/markdown";
      filename = `${project.name.replace(/\s+/g, "-").toLowerCase()}-docs.md`;
      break;

    case "html":
      const htmlResult = await generateHTML(req, res);
      content = htmlResult.data.html;
      contentType = "text/html";
      filename = `${project.name.replace(/\s+/g, "-").toLowerCase()}-docs.html`;
      break;

    default:
      throw new AppError(
        "Unsupported export format. Use: openapi, markdown, or html",
        400
      );
  }

  // Set response headers for file download
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  res.send(content);
});

const getPublicDocumentation = catchAsync(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (!project.isPublic) {
    throw new AppError("This documentation is not publicly available", 403);
  }

  const endpoints = await Endpoint.find({ projectId: id }).sort("order");

  // Update view count
  project.analytics.views += 1;
  project.analytics.lastViewed = new Date();
  await project.save();

  res.json({
    success: true,
    message: "Public documentation retrieved successfully",
    data: {
      project: {
        name: project.name,
        description: project.description,
        version: project.version,
        baseUrl: project.baseUrl,
      },
      endpoints: endpoints.map((endpoint) => ({
        id: endpoint._id,
        method: endpoint.method,
        path: endpoint.path,
        summary: endpoint.summary,
        description: endpoint.description,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: endpoint.responses,
        tags: endpoint.tags,
        deprecated: endpoint.deprecated,
      })),
    },
  });
});

const validateDocumentation = catchAsync(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (!project.hasAccess(req.userId)) {
    throw new AppError("Access denied", 403);
  }

  const endpoints = await Endpoint.find({ projectId: id });

  const issues = [];
  const warnings = [];

  // Validate project
  if (!project.description) {
    warnings.push("Project description is missing");
  }

  if (!project.baseUrl) {
    warnings.push("Base URL is not set");
  }

  // Validate endpoints
  endpoints.forEach((endpoint) => {
    const endpointPath = `${endpoint.method} ${endpoint.path}`;

    // Check for missing required fields
    if (!endpoint.summary || endpoint.summary.trim() === "") {
      issues.push(`${endpointPath}: Summary is missing`);
    }

    if (!endpoint.responses || endpoint.responses.length === 0) {
      issues.push(`${endpointPath}: No responses defined`);
    }

    // Check for good practices
    if (!endpoint.description) {
      warnings.push(`${endpointPath}: Description is missing`);
    }

    if (!endpoint.tags || endpoint.tags.length === 0) {
      warnings.push(`${endpointPath}: No tags assigned`);
    }

    // Validate path parameters
    const pathParams = endpoint.path.match(/{([^}]+)}/g) || [];
    const definedPathParams =
      endpoint.parameters?.filter((p) => p.in === "path") || [];

    if (pathParams.length !== definedPathParams.length) {
      issues.push(`${endpointPath}: Path parameter count mismatch`);
    }

    // Check for missing examples
    if (endpoint.requestBody && !endpoint.requestBody.example) {
      warnings.push(`${endpointPath}: Request body example is missing`);
    }

    endpoint.responses?.forEach((response) => {
      if (!response.example) {
        warnings.push(
          `${endpointPath}: Response ${response.statusCode} example is missing`
        );
      }
    });
  });

  const score = Math.max(0, 100 - issues.length * 10 - warnings.length * 2);

  res.json({
    success: true,
    message: "Documentation validation completed",
    data: {
      score,
      status:
        score >= 80
          ? "excellent"
          : score >= 60
          ? "good"
          : score >= 40
          ? "fair"
          : "poor",
      issues,
      warnings,
      statistics: {
        totalEndpoints: endpoints.length,
        endpointsWithDescription: endpoints.filter((e) => e.description).length,
        endpointsWithExamples: endpoints.filter(
          (e) => e.requestBody?.example || e.responses?.some((r) => r.example)
        ).length,
        endpointsWithTags: endpoints.filter((e) => e.tags?.length > 0).length,
      },
    },
  });
});

module.exports = {
  generateOpenAPISpec,
  generateMarkdownDocs,
  generateHTML,
  exportDocumentation,
  getPublicDocumentation,
  validateDocumentation,
};
