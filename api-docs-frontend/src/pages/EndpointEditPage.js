import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { useEndpoints } from "../hooks/useEndpoints";
import { endpointsAPI } from "../services/api";
import { PageContainer, Card } from "../components/common/Layout";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  HTTP_METHODS,
  PARAMETER_TYPES,
  STATUS_CODES,
} from "../utils/constants";
import toast from "react-hot-toast";

const EndpointEditPage = () => {
  const { projectId, id } = useParams();
  const navigate = useNavigate();
  const { updateEndpoint } = useEndpoints(projectId);

  const [endpoint, setEndpoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    method: "GET",
    path: "/",
    summary: "",
    description: "",
    tags: [],
    parameters: [],
    responses: [],
    deprecated: false,
  });

  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState("");

  // Fetch endpoint data
  useEffect(() => {
    const fetchEndpoint = async () => {
      try {
        const response = await endpointsAPI.getById(id);
        if (response.data.success) {
          const endpointData = response.data.data.endpoint;
          setEndpoint(endpointData);
          setFormData({
            method: endpointData.method || "GET",
            path: endpointData.path || "/",
            summary: endpointData.summary || "",
            description: endpointData.description || "",
            tags: endpointData.tags || [],
            parameters: endpointData.parameters || [],
            responses: endpointData.responses || [
              {
                statusCode: 200,
                description: "Successful response",
                example: null,
              },
            ],
            deprecated: endpointData.deprecated || false,
          });
        }
      } catch (error) {
        toast.error("Failed to load endpoint");
        navigate(`/projects/${projectId}/endpoints`);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEndpoint();
    }
  }, [id, projectId, navigate]);

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

  const handleParameterChange = (index, field, value) => {
    const newParameters = [...formData.parameters];
    newParameters[index] = { ...newParameters[index], [field]: value };
    setFormData((prev) => ({ ...prev, parameters: newParameters }));
  };

  const addParameter = () => {
    setFormData((prev) => ({
      ...prev,
      parameters: [
        ...prev.parameters,
        {
          name: "",
          type: "string",
          in: "query",
          required: false,
          description: "",
          example: "",
        },
      ],
    }));
  };

  const removeParameter = (index) => {
    setFormData((prev) => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index),
    }));
  };

  const handleResponseChange = (index, field, value) => {
    const newResponses = [...formData.responses];
    newResponses[index] = { ...newResponses[index], [field]: value };
    setFormData((prev) => ({ ...prev, responses: newResponses }));
  };

  const addResponse = () => {
    setFormData((prev) => ({
      ...prev,
      responses: [
        ...prev.responses,
        {
          statusCode: 400,
          description: "Bad request",
          example: null,
        },
      ],
    }));
  };

  const removeResponse = (index) => {
    if (formData.responses.length > 1) {
      setFormData((prev) => ({
        ...prev,
        responses: prev.responses.filter((_, i) => i !== index),
      }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.summary.trim()) {
      newErrors.summary = "Summary is required";
    }

    if (!formData.path.trim()) {
      newErrors.path = "Path is required";
    } else if (!formData.path.startsWith("/")) {
      newErrors.path = "Path must start with /";
    }

    if (formData.responses.length === 0) {
      newErrors.responses = "At least one response is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      // Process form data
      const endpointData = {
        ...formData,
        parameters: formData.parameters.filter((param) => param.name.trim()),
        responses: formData.responses.map((response) => ({
          ...response,
          example: response.example ? JSON.parse(response.example) : null,
        })),
      };

      const result = await updateEndpoint(id, endpointData);

      if (result.success) {
        toast.success("Endpoint updated successfully!");
        navigate(`/projects/${projectId}/endpoints`);
      }
    } catch (error) {
      toast.error("Failed to update endpoint. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading endpoint..." />;
  }

  return (
    <PageContainer
      title="Edit Endpoint"
      subtitle={`Editing ${endpoint?.method} ${endpoint?.path}`}
      action={
        <Link to={`/projects/${projectId}/endpoints`}>
          <Button variant="secondary" icon={ArrowLeft}>
            Back to Endpoints
          </Button>
        </Link>
      }
    >
      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card title="Basic Information">
            <div className="space-y-6">
              {/* Method and Path */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HTTP Method *
                  </label>
                  <select
                    name="method"
                    value={formData.method}
                    onChange={handleChange}
                    className="form-select"
                  >
                    {HTTP_METHODS.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Path *
                  </label>
                  <input
                    type="text"
                    name="path"
                    value={formData.path}
                    onChange={handleChange}
                    className={`form-input ${
                      errors.path ? "border-red-300" : ""
                    }`}
                    placeholder="/users/{id}"
                  />
                  {errors.path && (
                    <p className="mt-1 text-sm text-red-600">{errors.path}</p>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary *
                </label>
                <input
                  type="text"
                  name="summary"
                  value={formData.summary}
                  onChange={handleChange}
                  className={`form-input ${
                    errors.summary ? "border-red-300" : ""
                  }`}
                  placeholder="Brief description of what this endpoint does"
                />
                {errors.summary && (
                  <p className="mt-1 text-sm text-red-600">{errors.summary}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="form-textarea"
                  placeholder="Detailed description of the endpoint functionality"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    className="form-input"
                    placeholder="Add a tag"
                  />
                  <Button type="button" onClick={addTag} variant="secondary">
                    Add Tag
                  </Button>
                </div>
              </div>

              {/* Deprecated */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="deprecated"
                  id="deprecated"
                  checked={formData.deprecated}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="deprecated"
                  className="ml-2 text-sm text-gray-900"
                >
                  Mark as deprecated
                </label>
              </div>
            </div>
          </Card>

          {/* Parameters */}
          <Card title="Parameters">
            <div className="space-y-4">
              {formData.parameters.map((parameter, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                    <input
                      type="text"
                      placeholder="Parameter name"
                      value={parameter.name}
                      onChange={(e) =>
                        handleParameterChange(index, "name", e.target.value)
                      }
                      className="form-input"
                    />
                    <select
                      value={parameter.type}
                      onChange={(e) =>
                        handleParameterChange(index, "type", e.target.value)
                      }
                      className="form-select"
                    >
                      {PARAMETER_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={parameter.in}
                      onChange={(e) =>
                        handleParameterChange(index, "in", e.target.value)
                      }
                      className="form-select"
                    >
                      <option value="query">Query</option>
                      <option value="path">Path</option>
                      <option value="header">Header</option>
                    </select>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={parameter.required}
                          onChange={(e) =>
                            handleParameterChange(
                              index,
                              "required",
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm">Required</span>
                      </label>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeParameter(index)}
                        icon={Trash2}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Description"
                      value={parameter.description}
                      onChange={(e) =>
                        handleParameterChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      className="form-input"
                    />
                    <input
                      type="text"
                      placeholder="Example value"
                      value={parameter.example}
                      onChange={(e) =>
                        handleParameterChange(index, "example", e.target.value)
                      }
                      className="form-input"
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                onClick={addParameter}
                variant="secondary"
                icon={Plus}
              >
                Add Parameter
              </Button>
            </div>
          </Card>

          {/* Responses */}
          <Card title="Responses">
            <div className="space-y-4">
              {formData.responses.map((response, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <select
                      value={response.statusCode}
                      onChange={(e) =>
                        handleResponseChange(
                          index,
                          "statusCode",
                          parseInt(e.target.value)
                        )
                      }
                      className="form-select"
                    >
                      {STATUS_CODES.map((status) => (
                        <option key={status.code} value={status.code}>
                          {status.code} - {status.description}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Response description"
                      value={response.description}
                      onChange={(e) =>
                        handleResponseChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      className="form-input"
                    />
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeResponse(index)}
                      disabled={formData.responses.length === 1}
                      icon={Trash2}
                    />
                  </div>
                  <textarea
                    placeholder="Response example (JSON)"
                    value={response.example || ""}
                    onChange={(e) =>
                      handleResponseChange(index, "example", e.target.value)
                    }
                    className="form-textarea"
                    rows={3}
                  />
                </div>
              ))}

              <Button
                type="button"
                onClick={addResponse}
                variant="secondary"
                icon={Plus}
              >
                Add Response
              </Button>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-3">
            <Link to={`/projects/${projectId}/endpoints`}>
              <Button variant="secondary">Cancel</Button>
            </Link>
            <Button
              type="submit"
              loading={saving}
              disabled={saving}
              icon={Save}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
};

export default EndpointEditPage;
