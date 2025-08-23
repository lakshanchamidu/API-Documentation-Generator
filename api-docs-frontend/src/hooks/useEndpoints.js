import { useState, useEffect } from "react";
import { endpointsAPI } from "../services/api";
import toast from "react-hot-toast";

export const useEndpoints = (projectId) => {
  const [endpoints, setEndpoints] = useState([]);
  const [groupedEndpoints, setGroupedEndpoints] = useState({});
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch endpoints for a project
  const fetchEndpoints = async (params = {}) => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await endpointsAPI.getByProject(projectId, params);

      if (response.data.success) {
        const data = response.data.data;
        setEndpoints(data.endpoints);
        setGroupedEndpoints(data.groupedByTags || {});
        setStatistics(data.statistics);
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to fetch endpoints";
      setError(message);
      console.error("Fetch endpoints error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get single endpoint
  const getEndpoint = async (endpointId) => {
    try {
      const response = await endpointsAPI.getById(endpointId);

      if (response.data.success) {
        return { success: true, endpoint: response.data.data.endpoint };
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch endpoint";
      return { success: false, error: message };
    }
  };

  // Create new endpoint
  const createEndpoint = async (endpointData) => {
    try {
      const response = await endpointsAPI.create(projectId, endpointData);

      if (response.data.success) {
        const newEndpoint = response.data.data.endpoint;
        setEndpoints((prev) => [...prev, newEndpoint]);

        // Update grouped endpoints
        if (newEndpoint.tags && newEndpoint.tags.length > 0) {
          setGroupedEndpoints((prev) => {
            const updated = { ...prev };
            newEndpoint.tags.forEach((tag) => {
              if (!updated[tag]) updated[tag] = [];
              updated[tag].push(newEndpoint);
            });
            return updated;
          });
        } else {
          setGroupedEndpoints((prev) => ({
            ...prev,
            untagged: [...(prev.untagged || []), newEndpoint],
          }));
        }

        toast.success("Endpoint created successfully");
        return { success: true, endpoint: newEndpoint };
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to create endpoint";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Update endpoint
  const updateEndpoint = async (endpointId, endpointData) => {
    try {
      const response = await endpointsAPI.update(endpointId, endpointData);

      if (response.data.success) {
        const updatedEndpoint = response.data.data.endpoint;

        setEndpoints((prev) =>
          prev.map((e) => (e._id === endpointId ? updatedEndpoint : e))
        );

        // Refresh grouped endpoints
        fetchEndpoints();

        toast.success("Endpoint updated successfully");
        return { success: true, endpoint: updatedEndpoint };
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to update endpoint";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Delete endpoint
  const deleteEndpoint = async (endpointId) => {
    try {
      const response = await endpointsAPI.delete(endpointId);

      if (response.data.success) {
        setEndpoints((prev) => prev.filter((e) => e._id !== endpointId));

        // Update grouped endpoints
        setGroupedEndpoints((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((tag) => {
            updated[tag] = updated[tag].filter((e) => e._id !== endpointId);
            if (updated[tag].length === 0) {
              delete updated[tag];
            }
          });
          return updated;
        });

        toast.success("Endpoint deleted successfully");
        return { success: true };
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to delete endpoint";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Duplicate endpoint
  const duplicateEndpoint = async (endpointId, duplicateData = {}) => {
    try {
      const response = await endpointsAPI.duplicate(endpointId, duplicateData);

      if (response.data.success) {
        const duplicatedEndpoint = response.data.data.endpoint;
        setEndpoints((prev) => [...prev, duplicatedEndpoint]);

        // Update grouped endpoints
        if (duplicatedEndpoint.tags && duplicatedEndpoint.tags.length > 0) {
          setGroupedEndpoints((prev) => {
            const updated = { ...prev };
            duplicatedEndpoint.tags.forEach((tag) => {
              if (!updated[tag]) updated[tag] = [];
              updated[tag].push(duplicatedEndpoint);
            });
            return updated;
          });
        } else {
          setGroupedEndpoints((prev) => ({
            ...prev,
            untagged: [...(prev.untagged || []), duplicatedEndpoint],
          }));
        }

        toast.success("Endpoint duplicated successfully");
        return { success: true, endpoint: duplicatedEndpoint };
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to duplicate endpoint";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Reorder endpoints
  const reorderEndpoints = async (endpointOrders) => {
    try {
      const response = await endpointsAPI.reorder(projectId, {
        endpointOrders,
      });

      if (response.data.success) {
        const reorderedEndpoints = response.data.data.endpoints;
        setEndpoints(reorderedEndpoints);
        toast.success("Endpoints reordered successfully");
        return { success: true, endpoints: reorderedEndpoints };
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to reorder endpoints";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Get endpoints by tag
  const getEndpointsByTag = async (tag) => {
    try {
      const response = await endpointsAPI.getByTag(projectId, tag);

      if (response.data.success) {
        return { success: true, endpoints: response.data.data.endpoints };
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to fetch endpoints by tag";
      return { success: false, error: message };
    }
  };

  // Get endpoint statistics
  const getEndpointStats = async () => {
    try {
      const response = await endpointsAPI.getStats(projectId);

      if (response.data.success) {
        setStatistics(response.data.data);
        return { success: true, statistics: response.data.data };
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to fetch endpoint statistics";
      return { success: false, error: message };
    }
  };

  // Filter endpoints by method
  const filterByMethod = (method) => {
    return endpoints.filter(
      (endpoint) => endpoint.method.toLowerCase() === method.toLowerCase()
    );
  };

  // Search endpoints
  const searchEndpoints = (query) => {
    if (!query) return endpoints;

    const searchTerm = query.toLowerCase();
    return endpoints.filter(
      (endpoint) =>
        endpoint.summary?.toLowerCase().includes(searchTerm) ||
        endpoint.description?.toLowerCase().includes(searchTerm) ||
        endpoint.path?.toLowerCase().includes(searchTerm) ||
        endpoint.method?.toLowerCase().includes(searchTerm) ||
        endpoint.tags?.some((tag) => tag.toLowerCase().includes(searchTerm))
    );
  };

  // Get unique tags
  const getUniqueTags = () => {
    const tags = new Set();
    endpoints.forEach((endpoint) => {
      if (endpoint.tags) {
        endpoint.tags.forEach((tag) => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  };

  // Get methods count
  const getMethodsCounts = () => {
    const counts = {};
    endpoints.forEach((endpoint) => {
      const method = endpoint.method;
      counts[method] = (counts[method] || 0) + 1;
    });
    return counts;
  };

  // Refresh endpoints
  const refreshEndpoints = () => {
    if (projectId) {
      fetchEndpoints();
    }
  };

  // Initial fetch when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchEndpoints();
    } else {
      setEndpoints([]);
      setGroupedEndpoints({});
      setStatistics(null);
      setLoading(false);
    }
  }, [projectId]);

  return {
    // Data
    endpoints,
    groupedEndpoints,
    statistics,
    loading,
    error,

    // Actions
    fetchEndpoints,
    getEndpoint,
    createEndpoint,
    updateEndpoint,
    deleteEndpoint,
    duplicateEndpoint,
    reorderEndpoints,
    getEndpointsByTag,
    getEndpointStats,
    refreshEndpoints,

    // Helpers
    filterByMethod,
    searchEndpoints,
    getUniqueTags,
    getMethodsCounts,
  };
};
