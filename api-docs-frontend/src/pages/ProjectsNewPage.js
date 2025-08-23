import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Globe, Lock, Save } from "lucide-react";
import { useProjects } from "../hooks/useProjects";
import { PageContainer, Card } from "../components/common/Layout";
import Button from "../components/common/Button";
import { validateUrl } from "../utils/helpers";
import toast from "react-hot-toast";

const ProjectNewPage = () => {
  const navigate = useNavigate();
  const { createProject } = useProjects();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    baseUrl: "",
    version: "1.0.0",
    isPublic: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Project name must be at least 2 characters";
    } else if (formData.name.length > 100) {
      newErrors.name = "Project name must be less than 100 characters";
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    // Base URL validation
    if (formData.baseUrl && !validateUrl(formData.baseUrl)) {
      newErrors.baseUrl = "Please enter a valid URL";
    }

    // Version validation
    if (formData.version && !/^\d+\.\d+\.\d+$/.test(formData.version)) {
      newErrors.version =
        "Version must follow semantic versioning (e.g., 1.0.0)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await createProject({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        baseUrl: formData.baseUrl.trim() || undefined,
        version: formData.version || "1.0.0",
        isPublic: formData.isPublic,
      });

      if (result.success) {
        toast.success("Project created successfully!");
        navigate(`/projects/${result.project._id}`);
      }
    } catch (error) {
      toast.error("Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Create New Project"
      subtitle="Set up a new API documentation project"
      action={
        <Link to="/projects">
          <Button variant="secondary" icon={ArrowLeft}>
            Back to Projects
          </Button>
        </Link>
      }
    >
      <div className="max-w-2xl">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`form-input ${
                  errors.name
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                placeholder="Enter project name (e.g., User Management API)"
                maxLength={100}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Choose a clear, descriptive name for your API project
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={`form-textarea ${
                  errors.description
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                placeholder="Brief description of your API (optional)"
                maxLength={500}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
              <div className="mt-1 flex justify-between text-sm text-gray-500">
                <span>Optional but recommended for better documentation</span>
                <span>{formData.description.length}/500</span>
              </div>
            </div>

            {/* Base URL */}
            <div>
              <label
                htmlFor="baseUrl"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Base URL
              </label>
              <input
                type="url"
                id="baseUrl"
                name="baseUrl"
                value={formData.baseUrl}
                onChange={handleChange}
                className={`form-input ${
                  errors.baseUrl
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                placeholder="https://api.example.com (optional)"
              />
              {errors.baseUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.baseUrl}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                The base URL where your API is hosted (can be added later)
              </p>
            </div>

            {/* Version */}
            <div>
              <label
                htmlFor="version"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Version
              </label>
              <input
                type="text"
                id="version"
                name="version"
                value={formData.version}
                onChange={handleChange}
                className={`form-input ${
                  errors.version
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                placeholder="1.0.0"
              />
              {errors.version && (
                <p className="mt-1 text-sm text-red-600">{errors.version}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Semantic version number (major.minor.patch)
              </p>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Project Visibility
              </label>
              <div className="space-y-3">
                <label className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="isPublic"
                    value={false}
                    checked={!formData.isPublic}
                    onChange={() =>
                      setFormData((prev) => ({ ...prev, isPublic: false }))
                    }
                    className="mt-0.5 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">
                        Private
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Only you and your team members can access this project
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="isPublic"
                    value={true}
                    checked={formData.isPublic}
                    onChange={() =>
                      setFormData((prev) => ({ ...prev, isPublic: true }))
                    }
                    className="mt-0.5 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">
                        Public
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Anyone with the link can view your API documentation
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Link to="/projects">
                <Button variant="secondary">Cancel</Button>
              </Link>
              <Button
                type="submit"
                loading={loading}
                disabled={loading}
                icon={Save}
              >
                Create Project
              </Button>
            </div>
          </form>
        </Card>

        {/* Help Section */}
        <Card className="mt-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Getting Started Tips
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xs font-medium mt-0.5">
                  1
                </span>
                <p>
                  <strong>Choose a descriptive name</strong> - This will be
                  displayed in your documentation and helps users understand
                  your API's purpose.
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xs font-medium mt-0.5">
                  2
                </span>
                <p>
                  <strong>Add a base URL</strong> - If your API is already
                  deployed, adding the base URL will make testing easier.
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xs font-medium mt-0.5">
                  3
                </span>
                <p>
                  <strong>Start private</strong> - You can always make your
                  documentation public later when it's ready.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default ProjectNewPage;
