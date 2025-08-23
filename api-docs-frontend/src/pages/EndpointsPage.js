import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  ArrowLeft,
  Code,
  Edit,
  Trash2,
  Copy,
  Eye,
  MoreVertical,
} from "lucide-react";
import { useEndpoints } from "../hooks/useEndpoints";
import { projectsAPI } from "../services/api";
import { PageContainer, Card, EmptyState } from "../components/common/Layout";
import Button, { IconButton } from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getMethodColor, formatDate } from "../utils/helpers";
import toast from "react-hot-toast";

const EndpointsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");

  const {
    endpoints,
    groupedEndpoints,
    statistics,
    loading,
    deleteEndpoint,
    duplicateEndpoint,
    getUniqueTags,
    getMethodsCounts,
  } = useEndpoints(projectId);

  // Fetch project info
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await projectsAPI.getById(projectId);
        if (response.data.success) {
          setProject(response.data.data.project);
        }
      } catch (error) {
        toast.error("Failed to load project");
        navigate("/projects");
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId, navigate]);

  // Filter endpoints
  const filteredEndpoints = endpoints.filter((endpoint) => {
    const matchesSearch =
      endpoint.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.path?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMethod =
      selectedMethod === "all" || endpoint.method === selectedMethod;

    const matchesTag =
      selectedTag === "all" ||
      (endpoint.tags && endpoint.tags.includes(selectedTag));

    return matchesSearch && matchesMethod && matchesTag;
  });

  const handleDeleteEndpoint = async (endpointId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this endpoint? This action cannot be undone."
      )
    ) {
      await deleteEndpoint(endpointId);
    }
  };

  const handleDuplicateEndpoint = async (endpointId) => {
    await duplicateEndpoint(endpointId);
  };

  const uniqueTags = getUniqueTags();
  const methodCounts = getMethodsCounts();

  if (loading) {
    return <LoadingSpinner text="Loading endpoints..." />;
  }

  return (
    <PageContainer
      title={`${project?.name || "Project"} - Endpoints`}
      subtitle={`${endpoints.length} endpoint${
        endpoints.length !== 1 ? "s" : ""
      } total`}
      action={
        <div className="flex items-center space-x-2">
          <Link to={`/projects/${projectId}`}>
            <Button variant="secondary" icon={ArrowLeft}>
              Back to Project
            </Button>
          </Link>
          <Link to={`/projects/${projectId}/endpoints/new`}>
            <Button icon={Plus}>Add Endpoint</Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="form-select text-sm"
              >
                <option value="all">All Methods</option>
                {Object.entries(methodCounts).map(([method, count]) => (
                  <option key={method} value={method}>
                    {method} ({count})
                  </option>
                ))}
              </select>

              {uniqueTags.length > 0 && (
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="form-select text-sm"
                >
                  <option value="all">All Tags</option>
                  {uniqueTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </Card>

        {/* Endpoints List */}
        {filteredEndpoints.length > 0 ? (
          <div className="space-y-4">
            {filteredEndpoints.map((endpoint) => (
              <EndpointCard
                key={endpoint._id}
                endpoint={endpoint}
                projectId={projectId}
                onDelete={handleDeleteEndpoint}
                onDuplicate={handleDuplicateEndpoint}
              />
            ))}
          </div>
        ) : endpoints.length === 0 ? (
          <EmptyState
            icon={Code}
            title="No endpoints yet"
            description="Start by adding your first API endpoint to this project."
            action={
              <Link to={`/projects/${projectId}/endpoints/new`}>
                <Button icon={Plus} size="lg">
                  Add Your First Endpoint
                </Button>
              </Link>
            }
          />
        ) : (
          <EmptyState
            icon={Search}
            title="No endpoints found"
            description={`No endpoints match your search "${searchQuery}" or filter criteria.`}
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedMethod("all");
                  setSelectedTag("all");
                }}
              >
                Clear Filters
              </Button>
            }
          />
        )}

        {/* Quick Stats */}
        {statistics && (
          <Card title="Endpoint Statistics" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {statistics.endpointsByMethod?.map((method) => (
                <div key={method._id} className="text-center">
                  <div
                    className={`method-badge ${getMethodColor(
                      method._id
                    )} text-lg font-semibold mb-2`}
                  >
                    {method._id}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {method.count}
                  </p>
                  <p className="text-xs text-gray-500">endpoints</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};

// Endpoint Card Component
const EndpointCard = ({ endpoint, projectId, onDelete, onDuplicate }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Method and Path */}
          <div className="flex items-center space-x-3 mb-2">
            <span className={`method-badge ${getMethodColor(endpoint.method)}`}>
              {endpoint.method}
            </span>
            <code className="text-lg font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
              {endpoint.path}
            </code>
            {endpoint.deprecated && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Deprecated
              </span>
            )}
          </div>

          {/* Summary */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {endpoint.summary}
          </h3>

          {/* Description */}
          {endpoint.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {endpoint.description}
            </p>
          )}

          {/* Tags */}
          {endpoint.tags && endpoint.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {endpoint.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Updated {formatDate(endpoint.updatedAt)}</span>
            <span>•</span>
            <span>{endpoint.parameters?.length || 0} parameters</span>
            <span>•</span>
            <span>{endpoint.responses?.length || 0} responses</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <Link to={`/projects/${projectId}/endpoints/${endpoint._id}/edit`}>
            <IconButton
              icon={Edit}
              size="sm"
              tooltip="Edit endpoint"
              variant="secondary"
            />
          </Link>

          <div className="relative">
            <IconButton
              icon={MoreVertical}
              size="sm"
              variant="ghost"
              onClick={() => setShowMenu(!showMenu)}
            />
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <Link
                  to={`/projects/${projectId}/endpoints/${endpoint._id}`}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowMenu(false)}
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </Link>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDuplicate(endpoint._id);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                >
                  <Copy className="w-4 h-4" />
                  <span>Duplicate</span>
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(endpoint._id);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click overlay for the card */}
      <Link
        to={`/projects/${projectId}/endpoints/${endpoint._id}`}
        className="absolute inset-0 z-0"
      />
    </Card>
  );
};

export default EndpointsPage;
