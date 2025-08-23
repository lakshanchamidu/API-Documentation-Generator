import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Menu, X } from "lucide-react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AuthContext";
import { PageLoadingSpinner } from "./LoadingSpinner";

const Layout = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <PageLoadingSpinner text="Loading..." />;
  }

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register"];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // If not authenticated and not on a public route, don't render layout
  if (!isAuthenticated && !isPublicRoute) {
    return children || <Outlet />;
  }

  // Render different layouts for authenticated vs public pages
  if (isAuthenticated) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
  } else {
    return <PublicLayout>{children}</PublicLayout>;
  }
};

// Layout for authenticated users
const AuthenticatedLayout = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Determine if sidebar should be shown
  const showSidebar =
    !location.pathname.includes("/docs/") &&
    !location.pathname.includes("/public/");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar with mobile menu button */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <nav className="bg-white border-b border-gray-200 h-16 flex items-center px-4">
          {showSidebar && (
            <button
              className="md:hidden mr-3 p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          )}
          <Navbar />
        </nav>
      </div>

      <div className="flex pt-16">
        {showSidebar && (
          <>
            {/* Sidebar (mobile + desktop) */}
            <div
              className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 overflow-y-auto transform transition-transform duration-200 ease-in-out 
              ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
              md:translate-x-0`}
            >
              <div className="flex items-center justify-between p-4 md:hidden">
                <h2 className="font-semibold text-gray-900">Menu</h2>
                <button
                  className="p-2 rounded-lg hover:bg-gray-100"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>
              <Sidebar />
            </div>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}
          </>
        )}

        <main
          className={`flex-1 transition-all duration-200 ${
            showSidebar ? "md:ml-64" : ""
          }`}
        >
          <div className="p-6">{children || <Outlet />}</div>
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#4ade80",
              secondary: "#fff",
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </div>
  );
};

// Layout for public pages (login, register, home)
const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {children || <Outlet />}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#4ade80",
              secondary: "#fff",
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </div>
  );
};

// Centered layout for forms and single-column content
export const CenteredLayout = ({ children, maxWidth = "md" }) => {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className={`w-full ${maxWidthClasses[maxWidth]} space-y-8`}>
        {children}
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
    </div>
  );
};

// Container for page content
export const PageContainer = ({
  title,
  subtitle,
  action,
  children,
  className = "",
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      <div>{children}</div>
    </div>
  );
};

// Card container
export const Card = ({
  title,
  subtitle,
  action,
  children,
  className = "",
  padding = true,
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      {(title || subtitle || action) && (
        <div
          className={`flex items-center justify-between ${
            padding ? "p-6 pb-4" : "p-4"
          }`}
        >
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      <div className={padding ? "p-6 pt-0" : ""}>{children}</div>
    </div>
  );
};

// Empty state component
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && <Icon className="mx-auto h-12 w-12 text-gray-400" />}
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default Layout;
