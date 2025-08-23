import axios from "axios";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { API_BASE_URL } from "../utils/constants";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || "An error occurred";

    // Handle specific error codes
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      Cookies.remove("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    } else if (error.response?.status === 403) {
      // Forbidden
      toast.error("Access denied. You don't have permission for this action.");
    } else if (error.response?.status === 404) {
      // Not found
      toast.error("Resource not found");
    } else if (error.response?.status >= 500) {
      // Server error
      toast.error("Server error. Please try again later.");
    } else {
      // Other errors
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.put("/auth/change-password", data),
  getUserStats: () => api.get("/auth/stats"),
};

// Projects API endpoints
export const projectsAPI = {
  getAll: (params = {}) => api.get("/projects", { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post("/projects", data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getAnalytics: (id) => api.get(`/projects/${id}/analytics`),
  addCollaborator: (id, data) =>
    api.post(`/projects/${id}/collaborators`, data),
  updateCollaborator: (id, collaboratorId, data) =>
    api.put(`/projects/${id}/collaborators/${collaboratorId}`, data),
  removeCollaborator: (id, collaboratorId) =>
    api.delete(`/projects/${id}/collaborators/${collaboratorId}`),
};

// Endpoints API
export const endpointsAPI = {
  getByProject: (projectId, params = {}) =>
    api.get(`/endpoints/project/${projectId}`, { params }),
  getById: (id) => api.get(`/endpoints/${id}`),
  create: (projectId, data) =>
    api.post(`/endpoints/project/${projectId}`, data),
  update: (id, data) => api.put(`/endpoints/${id}`, data),
  delete: (id) => api.delete(`/endpoints/${id}`),
  duplicate: (id, data) => api.post(`/endpoints/${id}/duplicate`, data),
  reorder: (projectId, data) =>
    api.put(`/endpoints/project/${projectId}/reorder`, data),
  getStats: (projectId) => api.get(`/endpoints/project/${projectId}/stats`),
  getByTag: (projectId, tag) =>
    api.get(`/endpoints/project/${projectId}/tags/${tag}`),
};

// Tests API
export const testsAPI = {
  getByEndpoint: (endpointId, params = {}) =>
    api.get(`/tests/endpoint/${endpointId}`, { params }),
  getById: (id) => api.get(`/tests/${id}`),
  create: (endpointId, data) => api.post(`/tests/endpoint/${endpointId}`, data),
  update: (id, data) => api.put(`/tests/${id}`, data),
  delete: (id) => api.delete(`/tests/${id}`),
  run: (id) => api.post(`/tests/${id}/run`),
  runAll: (endpointId) => api.post(`/tests/endpoint/${endpointId}/run-all`),
  getHistory: (id, params = {}) => api.get(`/tests/${id}/history`, { params }),
};

// Documentation API
export const docsAPI = {
  getPublic: (projectId) => api.get(`/docs/public/${projectId}`),
  generateOpenAPI: (projectId, params = {}) =>
    api.get(`/docs/${projectId}/openapi`, { params }),
  generateMarkdown: (projectId) => api.get(`/docs/${projectId}/markdown`),
  generateHTML: (projectId, params = {}) =>
    api.get(`/docs/${projectId}/html`, { params }),
  exportDocumentation: (projectId, params = {}) =>
    api.get(`/docs/${projectId}/export`, { params }),
  validateDocumentation: (projectId) => api.get(`/docs/${projectId}/validate`),
};

// Upload API
export const uploadAPI = {
  importPostman: (projectId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/upload/postman/${projectId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  importOpenAPI: (projectId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/upload/openapi/${projectId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

// Health check
export const healthAPI = {
  check: () =>
    api.get("/health", { baseURL: API_BASE_URL.replace("/api", "") }),
};

// Generic API helper functions
export const apiHelpers = {
  // Handle API response
  handleResponse: (response) => {
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "API request failed");
  },

  // Handle API error
  handleError: (error) => {
    const message =
      error.response?.data?.message || error.message || "An error occurred";
    console.error("API Error:", message);
    throw new Error(message);
  },

  // Create query string from params
  createQueryString: (params) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (
        params[key] !== undefined &&
        params[key] !== null &&
        params[key] !== ""
      ) {
        searchParams.append(key, params[key]);
      }
    });
    return searchParams.toString();
  },
};

export default api;
