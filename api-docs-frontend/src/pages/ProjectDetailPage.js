import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Code,
  Globe,
  Lock,
  Plus,
  Settings,
  BarChart3,
  FileText,
  Users,
  Calendar,
  ExternalLink,
  Edit,
  Upload,
} from "lucide-react";
import { projectsAPI } from "../services/api";
import { useEndpoints } from "../hooks/useEndpoints";
import { PageContainer, Card, EmptyState } from "../components/common/Layout";
import Button, { IconButton } from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatDate, getMethodColor } from "../utils/helpers";
import toast from "react-hot-toast";

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const { endpoints, loading: endpointsLoading, statistics } = useEndpoints(id);

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await projectsAPI.getById(id);
        if (response.data.success) {
          setProject(response.data.data.project);
        }
      } catch (error) {
        toast.error("Failed to load project");
        navigate("/projects");
      } finally {
        setLoading(false);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const response = await projectsAPI.getAnalytics(id);
        if (response.data.success) {
          setAnalytics(response.data.data.analytics);
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);
      }
    };

    if (id) {
      fetchProject();
      fetchAnalytics();
    }
  }, [id, navigate]);

  if (loading) {
    return <LoadingSpinner text="Loading project..." />;
  }

  if (!project) {
    return (
      <PageContainer>
        <EmptyState
          icon={FileText}
          title="Project not found"
          description="The project you're looking for doesn't exist or you don't have access to it."
          action={
            <Link to="/projects">
              <Button>Back to Projects</Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  const statsData = [
    {
      title: "Total Endpoints",
      value: statistics?.totalEndpoints || 0,
      icon: Code,
      color: "text-blue-600",
    },
    {
      title: "Documentation Views",
      value: analytics?.projectViews || 0,
      icon: BarChart3,
      color: "text-green-600",
    },
    {
      title: "Team Members",
      value: (project.collaborators?.length || 0) + 1, // +1 for owner
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Last Updated",
      value: formatDate(project.updatedAt),
      icon: Calendar,
      color: "text-orange-600",
      isDate: true,
    },
  ];

  return (
    <PageContainer
      title={project.name}
      subtitle={project.description || "No description provided"}
      action={
        <div className="flex items-center space-x-2">
          {project.isPublic && (
            <Button
              variant="secondary"
              size="sm"
              icon={ExternalLink}
              onClick={() => window.open(`/public/${project._id}`, "_blank")}
            >
              View Public Docs
            </Button>
          )}
          <IconButton
            icon={Settings}
            tooltip="Project Settings"
            onClick={() => navigate(`/projects/${id}/settings`)}
          />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Project Info */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {project.isPublic ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <Globe className="w-4 h-4 mr-1" />
                    Public
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    <Lock className="w-4 h-4 mr-1" />
                    Private
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  Version {project.version}
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="secondary"
              icon={Edit}
              onClick={() => navigate(`/projects/${id}/edit`)}
            >
              Edit Project
            </Button>
          </div>

          {project.baseUrl && (
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700">
                Base URL:{" "}
              </span>
              <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                {project.baseUrl}
              </span>
            </div>
          )}

          <div className="text-sm text-gray-500">
            Created {formatDate(project.createdAt)} • Last updated{" "}
            {formatDate(project.updatedAt)}
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-4">
                <div className="flex items-center">
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">
                      {stat.title}
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {stat.isDate ? stat.value : stat.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Endpoints */}
          <Card
            title="API Endpoints"
            subtitle={`${endpoints.length} endpoint${
              endpoints.length !== 1 ? "s" : ""
            } total`}
            action={
              <div className="flex space-x-2">
                <Link to={`/projects/${id}/endpoints`}>
                  <Button variant="secondary" size="sm">
                    View All
                  </Button>
                </Link>
                <Link to={`/projects/${id}/endpoints/new`}>
                  <Button size="sm" icon={Plus}>
                    Add Endpoint
                  </Button>
                </Link>
              </div>
            }
          >
            {endpointsLoading ? (
              <LoadingSpinner size="sm" text="Loading endpoints..." />
            ) : endpoints.length > 0 ? (
              <div className="space-y-3">
                {endpoints.slice(0, 5).map((endpoint) => (
                  <Link
                    key={endpoint._id}
                    to={`/projects/${id}/endpoints`}
                    className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`method-badge ${getMethodColor(
                            endpoint.method
                          )}`}
                        >
                          {endpoint.method}
                        </span>
                        <span className="text-sm font-mono text-gray-900">
                          {endpoint.path}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(endpoint.updatedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {endpoint.summary}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Code}
                title="No endpoints yet"
                description="Start by adding your first API endpoint."
                action={
                  <Link to={`/projects/${id}/endpoints/new`}>
                    <Button icon={Plus}>Add First Endpoint</Button>
                  </Link>
                }
              />
            )}
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions" subtitle="Manage your project">
            <div className="space-y-3">
              <Link
                to={`/projects/${id}/endpoints/new`}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Plus className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Add Endpoint
                  </p>
                  <p className="text-xs text-gray-500">
                    Document a new API endpoint
                  </p>
                </div>
              </Link>

              <Link
                to={`/projects/${id}/import`}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Upload className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Import Data
                  </p>
                  <p className="text-xs text-gray-500">
                    From Postman or OpenAPI
                  </p>
                </div>
              </Link>

              <Link
                to={`/projects/${id}/docs`}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    View Documentation
                  </p>
                  <p className="text-xs text-gray-500">Generated API docs</p>
                </div>
              </Link>

              <Link
                to={`/projects/${id}/collaborators`}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-shrink-0 p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Manage Team
                  </p>
                  <p className="text-xs text-gray-500">Invite collaborators</p>
                </div>
              </Link>
            </div>
          </Card>
        </div>

        {/* Method Distribution */}
        {statistics && statistics.endpointsByMethod && (
          <Card
            title="Endpoint Methods"
            subtitle="Distribution of HTTP methods"
          >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {statistics.endpointsByMethod.map((method) => (
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

export default ProjectDetailPage;
