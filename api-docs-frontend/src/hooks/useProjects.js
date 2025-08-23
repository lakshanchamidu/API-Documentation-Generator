import { useState, useEffect } from "react";
import { projectsAPI } from "../services/api";
import toast from "react-hot-toast";

export const useProjects = (initialParams = {}) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Fetch all projects
  const fetchProjects = async (params = initialParams) => {
    try {
      setLoading(true);
      setError(null);

      const response = await projectsAPI.getAll(params);

      if (response.data.success) {
        setProjects(response.data.data.projects);
        setPagination(response.data.data.pagination);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch projects";
      setError(message);
      console.error("Fetch projects error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Create new project
  const createProject = async (projectData) => {
    try {
      const response = await projectsAPI.create(projectData);

      if (response.data.success) {
        const newProject = response.data.data.project;
        setProjects((prev) => [newProject, ...prev]);
        toast.success("Project created successfully");
        return { success: true, project: newProject };
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to create project";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Update project
  const updateProject = async (id, projectData) => {
    try {
      const response = await projectsAPI.update(id, projectData);

      if (response.data.success) {
        const updatedProject = response.data.data.project;
        setProjects((prev) =>
          prev.map((p) => (p._id === id ? updatedProject : p))
        );
        toast.success("Project updated successfully");
        return { success: true, project: updatedProject };
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update project";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Delete project
  const deleteProject = async (id) => {
    try {
      const response = await projectsAPI.delete(id);

      if (response.data.success) {
        setProjects((prev) => prev.filter((p) => p._id !== id));
        toast.success("Project deleted successfully");
        return { success: true };
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete project";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Get single project
  const getProject = async (id) => {
    try {
      const response = await projectsAPI.getById(id);

      if (response.data.success) {
        return { success: true, project: response.data.data.project };
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch project";
      return { success: false, error: message };
    }
  };

  // Add collaborator
  const addCollaborator = async (projectId, collaboratorData) => {
    try {
      const response = await projectsAPI.addCollaborator(
        projectId,
        collaboratorData
      );

      if (response.data.success) {
        const updatedProject = response.data.data.project;
        setProjects((prev) =>
          prev.map((p) => (p._id === projectId ? updatedProject : p))
        );
        toast.success("Collaborator added successfully");
        return { success: true, project: updatedProject };
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to add collaborator";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Remove collaborator
  const removeCollaborator = async (projectId, collaboratorId) => {
    try {
      const response = await projectsAPI.removeCollaborator(
        projectId,
        collaboratorId
      );

      if (response.data.success) {
        setProjects((prev) =>
          prev.map((p) => {
            if (p._id === projectId) {
              return {
                ...p,
                collaborators: p.collaborators.filter(
                  (c) => c.user._id !== collaboratorId
                ),
              };
            }
            return p;
          })
        );
        toast.success("Collaborator removed successfully");
        return { success: true };
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to remove collaborator";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Get project analytics
  const getProjectAnalytics = async (projectId) => {
    try {
      const response = await projectsAPI.getAnalytics(projectId);

      if (response.data.success) {
        return { success: true, analytics: response.data.data.analytics };
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to fetch analytics";
      return { success: false, error: message };
    }
  };

  // Refresh projects list
  const refreshProjects = () => {
    fetchProjects(initialParams);
  };

  // Initial fetch
  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    // Data
    projects,
    loading,
    error,
    pagination,

    // Actions
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    addCollaborator,
    removeCollaborator,
    getProjectAnalytics,
    refreshProjects,
  };
};
