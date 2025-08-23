import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  FolderOpen,
  Code,
  Users,
  BarChart3,
  Clock,
  Globe,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useProjects } from "../hooks/useProjects";
import { PageContainer, Card, EmptyState } from "../components/common/Layout";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatDate } from "../utils/helpers";

const DashboardPage = () => {
  const { user } = useAuth();
  const { projects, loading, error } = useProjects();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalEndpoints: 0,
    totalViews: 0,
    recentActivity: [],
  });

  // Calculate stats from projects
  useEffect(() => {
    if (projects.length > 0) {
      const totalProjects = projects.length;
      const totalEndpoints = projects.reduce(
        (sum, project) => sum + (project.endpointCount || 0),
        0
      );
      const totalViews = projects.reduce(
        (sum, project) => sum + (project.analytics?.views || 0),
        0
      );

      setStats({
        totalProjects,
        totalEndpoints,
        totalViews,
        recentActivity: projects.slice(0, 5), // Show 5 most recent projects
      });
    }
  }, [projects]);

  const statsCards = [
    {
      title: "Total Projects",
      value: stats.totalProjects,
      icon: FolderOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Endpoints",
      value: stats.totalEndpoints,
      icon: Code,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Documentation Views",
      value: stats.totalViews,
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Team Members",
      value: 1, // For now, just the user
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <PageContainer
      title={`Welcome back, ${user?.name?.split(" ")[0] || "there"}!`}
      subtitle="Here's what's happening with your API documentation"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-6">
                <div className="flex items-center">
                  <div
                    className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}
                  >
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <Card
            title="Recent Projects"
            subtitle={
              projects.length > 0
                ? `${projects.length} total projects`
                : "No projects yet"
            }
            action={
              <Link to="/projects">
                <Button variant="secondary" size="sm">
                  View All
                </Button>
              </Link>
            }
          >
            {projects.length > 0 ? (
              <div className="space-y-3">
                {projects.slice(0, 3).map((project) => (
                  <Link
                    key={project._id}
                    to={`/projects/${project._id}`}
                    className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <FolderOpen className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {project.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {project.endpointCount || 0} endpoints
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          Updated {formatDate(project.updatedAt)}
                        </p>
                        {project.isPublic && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Globe className="w-3 h-3 mr-1" />
                            Public
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
                {projects.length === 0 && (
                  <EmptyState
                    icon={FolderOpen}
                    title="No projects yet"
                    description="Create your first API documentation project to get started."
                    action={
                      <Link to="/projects/new">
                        <Button icon={Plus}>Create Project</Button>
                      </Link>
                    }
                  />
                )}
              </div>
            ) : (
              <EmptyState
                icon={FolderOpen}
                title="No projects yet"
                description="Create your first API documentation project to get started."
                action={
                  <Link to="/projects/new">
                    <Button icon={Plus}>Create Your First Project</Button>
                  </Link>
                }
              />
            )}
          </Card>

          {/* Quick Actions */}
          <Card
            title="Quick Actions"
            subtitle="Common tasks to get you started"
          >
            <div className="space-y-3">
              <Link
                to="/projects/new"
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-shrink-0 p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                  <Plus className="w-5 h-5 text-primary-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Create New Project
                  </p>
                  <p className="text-xs text-gray-500">
                    Start documenting a new API
                  </p>
                </div>
              </Link>

              <div className="flex items-center p-3 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex-shrink-0 p-2 bg-gray-200 rounded-lg">
                  <Code className="w-5 h-5 text-gray-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Import from Postman
                  </p>
                  <p className="text-xs text-gray-400">
                    Available after creating a project
                  </p>
                </div>
              </div>

              <div className="flex items-center p-3 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex-shrink-0 p-2 bg-gray-200 rounded-lg">
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">
                    Invite Team Members
                  </p>
                  <p className="text-xs text-gray-400">
                    Available in project settings
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Getting Started Guide */}
        {projects.length === 0 && (
          <Card
            title="Getting Started"
            subtitle="Follow these steps to create your first API documentation"
          >
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Create your first project
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Set up a new project with basic information about your API
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Add your API endpoints
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Document your API endpoints with detailed information
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Share your documentation
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Make your documentation public or share with team members
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/projects/new">
                <Button icon={Plus} size="lg">
                  Create Your First Project
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};

export default DashboardPage;
