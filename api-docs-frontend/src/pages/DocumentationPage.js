import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Eye,
  Code,
  FileText,
  Copy,
  ExternalLink,
  Settings,
} from "lucide-react";
import { docsAPI, projectsAPI } from "../services/api";
import { useEndpoints } from "../hooks/useEndpoints";
import { PageContainer, Card, EmptyState } from "../components/common/Layout";
import Button, { IconButton } from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  getMethodColor,
  copyToClipboard,
  downloadFile,
} from "../utils/helpers";
import { DOCUMENTATION_FORMATS } from "../utils/constants";
import toast from "react-hot-toast";

const DocumentationPage = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [activeFormat, setActiveFormat] = useState("preview");
  const [documentation, setDocumentation] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const { endpoints } = useEndpoints(id);

  // Fetch project and documentation
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await projectsAPI.getById(id);
        if (response.data.success) {
          setProject(response.data.data.project);
        }
      } catch (error) {
        toast.error("Failed to load project");
      }
    };

    const generateDocumentation = async () => {
      setGenerating(true);
      try {
        // Generate all formats
        const [htmlRes, markdownRes, openApiRes] = await Promise.all([
          docsAPI.generateHTML(id),
          docsAPI.generateMarkdown(id),
          docsAPI.generateOpenAPI(id),
        ]);

        setDocumentation({
          html: htmlRes.data.data.html,
          markdown: markdownRes.data.data.markdown,
          openapi: JSON.stringify(openApiRes.data.data.specification, null, 2),
        });
      } catch (error) {
        toast.error("Failed to generate documentation");
        console.error("Documentation generation error:", error);
      } finally {
        setGenerating(false);
        setLoading(false);
      }
    };

    if (id) {
      fetchProject();
      generateDocumentation();
    }
  }, [id]);

  const handleDownload = (format, content) => {
    let filename, contentType;

    switch (format) {
      case "html":
        filename = `${project.name}-docs.html`;
        contentType = "text/html";
        break;
      case "markdown":
        filename = `${project.name}-docs.md`;
        contentType = "text/markdown";
        break;
      case "openapi":
        filename = `${project.name}-openapi.json`;
        contentType = "application/json";
        break;
      default:
        return;
    }

    downloadFile(content, filename, contentType);
    toast.success(`Downloaded ${format.toUpperCase()} documentation`);
  };

  const handleCopy = async (content) => {
    const success = await copyToClipboard(content);
    if (success) {
      toast.success("Copied to clipboard");
    } else {
      toast.error("Failed to copy");
    }
  };

  const handlePreview = (format) => {
    const content = documentation[format];
    if (format === "html") {
      const blob = new Blob([content], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } else {
      // For other formats, we'll show in a modal or new tab
      const blob = new Blob([content], {
        type: format === "markdown" ? "text/markdown" : "application/json",
      });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading documentation..." />;
  }

  if (endpoints.length === 0) {
    return (
      <PageContainer
        title="Documentation"
        subtitle="Generate beautiful API documentation"
        action={
          <Link to={`/projects/${id}`}>
            <Button variant="secondary" icon={ArrowLeft}>
              Back to Project
            </Button>
          </Link>
        }
      >
        <EmptyState
          icon={FileText}
          title="No endpoints to document"
          description="Add some API endpoints to your project to generate documentation."
          action={
            <Link to={`/projects/${id}/endpoints/new`}>
              <Button icon={Code}>Add First Endpoint</Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Documentation"
      subtitle={`Generated documentation for ${project?.name || "project"}`}
      action={
        <div className="flex items-center space-x-2">
          <Link to={`/projects/${id}`}>
            <Button variant="secondary" icon={ArrowLeft}>
              Back to Project
            </Button>
          </Link>
          {project?.isPublic && (
            <Button
              variant="secondary"
              icon={ExternalLink}
              onClick={() => window.open(`/public/${id}`, "_blank")}
            >
              Public View
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Format Tabs */}
        <Card>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveFormat("preview")}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeFormat === "preview"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Preview
              </button>

              {DOCUMENTATION_FORMATS.map((format) => (
                <button
                  key={format.value}
                  onClick={() => setActiveFormat(format.value)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeFormat === format.value
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {format.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Action Buttons */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeFormat === "preview"
                    ? "Documentation Preview"
                    : DOCUMENTATION_FORMATS.find(
                        (f) => f.value === activeFormat
                      )?.label || "Documentation"}
                </h3>
                <p className="text-sm text-gray-500">
                  {activeFormat === "preview"
                    ? "Live preview of your documentation"
                    : DOCUMENTATION_FORMATS.find(
                        (f) => f.value === activeFormat
                      )?.description || ""}
                </p>
              </div>

              {activeFormat !== "preview" && (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Copy}
                    onClick={() => handleCopy(documentation[activeFormat])}
                  >
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Eye}
                    onClick={() => handlePreview(activeFormat)}
                  >
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    icon={Download}
                    onClick={() =>
                      handleDownload(activeFormat, documentation[activeFormat])
                    }
                  >
                    Download
                  </Button>
                </div>
              )}
            </div>

            {/* Content */}
            {generating ? (
              <LoadingSpinner text="Generating documentation..." />
            ) : (
              <div className="documentation-content">
                {activeFormat === "preview" ? (
                  <DocumentationPreview
                    project={project}
                    endpoints={endpoints}
                  />
                ) : (
                  <CodeViewer
                    code={documentation[activeFormat] || ""}
                    language={
                      activeFormat === "openapi" ? "json" : activeFormat
                    }
                  />
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Export Options */}
        <Card
          title="Export Options"
          subtitle="Download documentation in various formats"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DOCUMENTATION_FORMATS.map((format) => (
              <div
                key={format.value}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h4 className="font-medium text-gray-900 mb-2">
                  {format.label}
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  {format.description}
                </p>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handlePreview(format.value)}
                    icon={Eye}
                  >
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleDownload(format.value, documentation[format.value])
                    }
                    icon={Download}
                  >
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

// Documentation Preview Component
const DocumentationPreview = ({ project, endpoints }) => {
  const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
    const tags =
      endpoint.tags && endpoint.tags.length > 0 ? endpoint.tags : ["General"];
    tags.forEach((tag) => {
      if (!acc[tag]) acc[tag] = [];
      acc[tag].push(endpoint);
    });
    return acc;
  }, {});

  return (
    <div className="documentation-preview max-w-none">
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
        <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
        {project.description && (
          <p className="text-blue-100 mb-4">{project.description}</p>
        )}
        <div className="flex items-center space-x-6 text-sm">
          <span>Version: {project.version}</span>
          {project.baseUrl && <span>Base URL: {project.baseUrl}</span>}
        </div>
      </div>

      {/* Table of Contents */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Table of Contents
        </h2>
        <div className="space-y-1">
          {Object.keys(groupedEndpoints).map((tag) => (
            <div key={tag}>
              <a
                href={`#${tag.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-primary-600 hover:text-primary-800 font-medium"
              >
                {tag}
              </a>
              <div className="ml-4 space-y-1">
                {groupedEndpoints[tag].map((endpoint) => (
                  <div key={endpoint._id}>
                    <a
                      href={`#${endpoint.method.toLowerCase()}-${endpoint.path
                        .replace(/[^a-zA-Z0-9]/g, "-")
                        .toLowerCase()}`}
                      className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-2"
                    >
                      <span
                        className={`method-badge ${getMethodColor(
                          endpoint.method
                        )} text-xs`}
                      >
                        {endpoint.method}
                      </span>
                      <span>{endpoint.path}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Endpoints by Group */}
      {Object.entries(groupedEndpoints).map(([tag, tagEndpoints]) => (
        <div key={tag} className="mb-12">
          <h2
            id={tag.toLowerCase().replace(/\s+/g, "-")}
            className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2"
          >
            {tag}
          </h2>

          {tagEndpoints.map((endpoint) => (
            <div
              key={endpoint._id}
              id={`${endpoint.method.toLowerCase()}-${endpoint.path
                .replace(/[^a-zA-Z0-9]/g, "-")
                .toLowerCase()}`}
              className="mb-8 p-6 border border-gray-200 rounded-lg"
            >
              {/* Endpoint Header */}
              <div className="flex items-center space-x-3 mb-4">
                <span
                  className={`method-badge ${getMethodColor(endpoint.method)}`}
                >
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

              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {endpoint.summary}
              </h3>

              {endpoint.description && (
                <p className="text-gray-600 mb-4">{endpoint.description}</p>
              )}

              {/* Parameters */}
              {endpoint.parameters && endpoint.parameters.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Parameters
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Type
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            In
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Required
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {endpoint.parameters.map((param, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              {param.name}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {param.type}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {param.in}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {param.required ? "Yes" : "No"}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {param.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Responses */}
              {endpoint.responses && endpoint.responses.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Responses
                  </h4>
                  <div className="space-y-3">
                    {endpoint.responses.map((response, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded p-3"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-gray-100 text-gray-800">
                            {response.statusCode}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {response.description}
                          </span>
                        </div>
                        {response.example && (
                          <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                            {JSON.stringify(response.example, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Code Viewer Component
const CodeViewer = ({ code, language }) => {
  return (
    <div className="relative">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <IconButton
        icon={Copy}
        size="sm"
        variant="secondary"
        className="absolute top-2 right-2"
        onClick={() => copyToClipboard(code)}
        tooltip="Copy code"
      />
    </div>
  );
};

export default DocumentationPage;
