import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  Home,
  FolderOpen,
  Code,
  TestTube,
  FileText,
  Settings,
  BarChart3,
  Users,
  Upload,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const location = useLocation();
  const { id: projectId } = useParams();
  const { user } = useAuth();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  // Main navigation items
  const mainNavigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Projects",
      href: "/projects",
      icon: FolderOpen,
    },
  ];

  // Project-specific navigation (shown when viewing a project)
  const projectNavigation = projectId
    ? [
        {
          name: "Overview",
          href: `/projects/${projectId}`,
          icon: BarChart3,
        },
        {
          name: "Endpoints",
          href: `/projects/${projectId}/endpoints`,
          icon: Code,
        },
        {
          name: "Tests",
          href: `/projects/${projectId}/tests`,
          icon: TestTube,
        },
        {
          name: "Documentation",
          href: `/projects/${projectId}/docs`,
          icon: FileText,
        },
        {
          name: "Collaborators",
          href: `/projects/${projectId}/collaborators`,
          icon: Users,
        },
        {
          name: "Import",
          href: `/projects/${projectId}/import`,
          icon: Upload,
        },
        {
          name: "Settings",
          href: `/projects/${projectId}/settings`,
          icon: Settings,
        },
      ]
    : [];

  // Navigation item component
  const NavigationItem = ({ item, isProjectNav = false }) => (
    <Link
      to={item.href}
      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive(item.href)
          ? "bg-primary-50 text-primary-600"
          : isProjectNav
          ? "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
      }`}
    >
      <item.icon
        className={`mr-3 h-5 w-5 transition-colors ${
          isActive(item.href)
            ? "text-primary-600"
            : "text-gray-400 group-hover:text-gray-500"
        }`}
      />
      <span>{item.name}</span>

      {/* External link indicator */}
      {item.external && (
        <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
      )}
    </Link>
  );

  // User subscription info
  const subscriptionInfo = {
    free: { name: "Free Plan", color: "bg-gray-100 text-gray-800" },
    pro: { name: "Pro Plan", color: "bg-blue-100 text-blue-800" },
    enterprise: { name: "Enterprise", color: "bg-purple-100 text-purple-800" },
  };

  const currentPlan =
    subscriptionInfo[user?.subscription] || subscriptionInfo.free;

  return (
    <div className="fixed inset-y-4 left-0 w-64 bg-white border-r border-gray-200 pt-16 pb-4 overflow-y-auto scrollbar-hide">
      <div className="px-4 space-y-6">
        {/* Main Navigation */}
        <nav className="space-y-1">
          <div className="pb-2">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Main
            </h3>
          </div>
          {mainNavigation.map((item) => (
            <NavigationItem key={item.name} item={item} />
          ))}
        </nav>

        {/* Project Navigation */}
        {projectNavigation.length > 0 && (
          <nav className="space-y-1">
            <div className="pb-2">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Project
              </h3>
            </div>
            {projectNavigation.map((item) => (
              <NavigationItem key={item.name} item={item} isProjectNav />
            ))}
          </nav>
        )}

        {/* Quick Actions */}
        <div className="pt-4">
          <div className="pb-2">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Quick Actions
            </h3>
          </div>
          <div className="space-y-2">
            <Link
              to="/projects/new"
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <div className="mr-3 h-5 w-5 border-2 border-dashed border-gray-300 rounded group-hover:border-gray-400 transition-colors" />
              <span>New Project</span>
            </Link>
          </div>
        </div>

        {/* User Subscription Info */}
        <div className="pt-4 border-t border-gray-200">
          <div className="px-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Plan</span>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${currentPlan.color}`}
              >
                {currentPlan.name}
              </span>
            </div>

            {user?.subscription === "free" && (
              <div className="mt-2">
                <Link
                  to="/upgrade"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Upgrade Plan →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Usage Statistics for Free Users */}
        {user?.subscription === "free" && (
          <div className="pt-4 border-t border-gray-200">
            <div className="px-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Usage
              </h4>

              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Projects</span>
                    <span className="font-medium">2/3</span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-primary-600 h-1 rounded-full"
                      style={{ width: "66%" }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Endpoints</span>
                    <span className="font-medium">12/50</span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-primary-600 h-1 rounded-full"
                      style={{ width: "24%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help & Support */}
        <div className="pt-4 border-t border-gray-200">
          <div className="space-y-1">
            <a
              href="https://docs.api-generator.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <FileText className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              <span>Documentation</span>
              <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
            </a>

            <a
              href="mailto:support@api-generator.com"
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <Settings className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              <span>Support</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
