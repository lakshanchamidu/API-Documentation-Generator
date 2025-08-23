export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const HTTP_METHODS = [
  { value: "GET", label: "GET", color: "method-get" },
  { value: "POST", label: "POST", color: "method-post" },
  { value: "PUT", label: "PUT", color: "method-put" },
  { value: "DELETE", label: "DELETE", color: "method-delete" },
  { value: "PATCH", label: "PATCH", color: "method-patch" },
  { value: "HEAD", label: "HEAD", color: "method-get" },
  { value: "OPTIONS", label: "OPTIONS", color: "method-get" },
];

export const PARAMETER_TYPES = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "integer", label: "Integer" },
  { value: "boolean", label: "Boolean" },
  { value: "array", label: "Array" },
  { value: "object", label: "Object" },
  { value: "file", label: "File" },
];

export const PARAMETER_LOCATIONS = [
  { value: "query", label: "Query Parameter" },
  { value: "path", label: "Path Parameter" },
  { value: "header", label: "Header" },
  { value: "body", label: "Request Body" },
];

export const SUBSCRIPTION_PLANS = {
  free: {
    name: "Free",
    maxProjects: 3,
    maxEndpoints: 50,
    features: ["Basic documentation", "Public sharing", "Community support"],
  },
  pro: {
    name: "Pro",
    maxProjects: 25,
    maxEndpoints: 500,
    features: [
      "Advanced documentation",
      "Custom domains",
      "API testing",
      "Priority support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    maxProjects: -1,
    maxEndpoints: -1,
    features: [
      "Unlimited everything",
      "White-label",
      "SSO",
      "Dedicated support",
    ],
  },
};

export const DOCUMENTATION_FORMATS = [
  {
    value: "html",
    label: "HTML",
    description: "Interactive web documentation",
  },
  {
    value: "markdown",
    label: "Markdown",
    description: "README-style documentation",
  },
  {
    value: "openapi",
    label: "OpenAPI/Swagger",
    description: "API specification format",
  },
];

export const STATUS_CODES = [
  { code: 200, description: "OK - Success" },
  { code: 201, description: "Created - Resource created successfully" },
  { code: 400, description: "Bad Request - Invalid request" },
  { code: 401, description: "Unauthorized - Authentication required" },
  { code: 403, description: "Forbidden - Access denied" },
  { code: 404, description: "Not Found - Resource not found" },
  { code: 422, description: "Unprocessable Entity - Validation error" },
  { code: 500, description: "Internal Server Error - Server error" },
];

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  PROJECTS: "/projects",
  PROJECT_DETAIL: "/projects/:id",
  PROJECT_NEW: "/projects/new",
  PROJECT_EDIT: "/projects/:id/edit",
  ENDPOINTS: "/projects/:projectId/endpoints",
  ENDPOINT_NEW: "/projects/:projectId/endpoints/new",
  ENDPOINT_EDIT: "/projects/:projectId/endpoints/:id/edit",
  DOCUMENTATION: "/projects/:id/docs",
  PROFILE: "/profile",
};

export const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" },
];
