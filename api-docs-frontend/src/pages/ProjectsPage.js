import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  FolderOpen,
  Globe,
  Lock,
  Calendar,
  Code,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { useProjects } from "../hooks/useProjects";
import { PageContainer, Card, EmptyState } from "../components/common/Layout";
import Button, { IconButton } from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatDate, truncateText } from "../utils/helpers";

const ProjectsPage = () => {
  const { projects, loading, deleteProject } = useProjects();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'public', 'private'

  // Filter projects based on search and status
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "public" && project.isPublic) ||
      (filterStatus === "private" && !project.isPublic);

    return matchesSearch && matchesStatus;
  });

  const handleDeleteProject = async (projectId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      await deleteProject(projectId);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading projects..." />;
  }

  return (
    <PageContainer
      title="Projects"
      subtitle={`${projects.length} project${
        projects.length !== 1 ? "s" : ""
      } total`}
      action={
        <Link to="/projects/new">
          <Button icon={Plus}>New Project</Button>
        </Link>
      }
    >
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-select text-sm"
          >
            <option value="all">All Projects</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg">
            <IconButton
              icon={Grid3X3}
              size="sm"
              variant={viewMode === "grid" ? "primary" : "ghost"}
              onClick={() => setViewMode("grid")}
              className="rounded-r-none border-r border-gray-300"
            />
            <IconButton
              icon={List}
              size="sm"
              variant={viewMode === "list" ? "primary" : "ghost"}
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            />
          </div>
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length > 0 ? (
        <div
          className={`grid gap-6 ${
            viewMode === "grid"
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              viewMode={viewMode}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        // No projects at all
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create your first API documentation project to get started."
          action={
            <Link to="/projects/new">
              <Button icon={Plus} size="lg">
                Create Your First Project
              </Button>
            </Link>
          }
        />
      ) : (
        // No projects matching filter
        <EmptyState
          icon={Search}
          title="No projects found"
          description={`No projects match your search "${searchQuery}" or filter criteria.`}
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("all");
              }}
            >
              Clear Filters
            </Button>
          }
        />
      )}
    </PageContainer>
  );
};

// Project Card Component
const ProjectCard = ({ project, viewMode, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  const cardContent = (
    <>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FolderOpen className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {project.name}
          </h3>
        </div>

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
                to={`/projects/${project._id}`}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowMenu(false)}
              >
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </Link>
              <Link
                to={`/projects/${project._id}/endpoints`}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowMenu(false)}
              >
                <Code className="w-4 h-4" />
                <span>View Endpoints</span>
              </Link>
              <Link
                to={`/projects/${project._id}/docs`}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowMenu(false)}
              >
                <FolderOpen className="w-4 h-4" />
                <span>View Documentation</span>
              </Link>
              <Link
                to={`/projects/${project._id}/edit`}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowMenu(false)}
              >
                <Edit className="w-4 h-4" />
                <span>Edit Project</span>
              </Link>
              <hr className="my-1" />
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete(project._id);
                }}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Project</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-3">
        {project.description
          ? truncateText(project.description, 100)
          : "No description"}
      </p>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {project.isPublic ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <Globe className="w-3 h-3 mr-1" />
              Public
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <Lock className="w-3 h-3 mr-1" />
              Private
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Code className="w-3 h-3" />
          <span>{project.endpointCount || 0} endpoints</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span>Updated {formatDate(project.updatedAt)}</span>
        </div>

        {project.analytics?.views > 0 && (
          <span>{project.analytics.views} views</span>
        )}
      </div>
    </>
  );

  if (viewMode === "list") {
    return (
      <Link to={`/projects/${project._id}`}>
        <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">{cardContent}</div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer h-full relative">
      {cardContent}
      <Link to={`/projects/${project._id}`} className="absolute inset-0 z-0" />
      {/* Menu needs higher z-index */}
      <div className="absolute top-4 right-4 z-10">
        {/* Menu button is already in the cardContent */}
      </div>
    </Card>
  );
};

export default ProjectsPage;
