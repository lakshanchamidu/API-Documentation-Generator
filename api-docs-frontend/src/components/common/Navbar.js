import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FileText,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Search,
  Bell,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Button, { IconButton } from "./Button";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: FileText },
    { path: "/projects", label: "Projects", icon: FileText },
  ];

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center space-x-2 pr-4">
                <FileText className="w-8 h-8 text-primary-600" />
                <span className="font-bold text-xl text-gray-900">
                  API Docs
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? "text-primary-600 bg-primary-50"
                          : "text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="hidden md:block relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-72"
                />
              </div>

              {/* Create New Button */}
              <Button
                size="sm"
                icon={Plus}
                onClick={() => navigate("/projects/new")}
                className="hidden md:flex"
              >
                New Project
              </Button>

              {/* Notifications */}
              <IconButton
                icon={Bell}
                tooltip="Notifications"
                className="relative"
              >
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </IconButton>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>

                  {/* Name + Subscription */}
                  <div className="hidden md:flex flex-col leading-tight text-left">
                    <span className="text-sm font-medium text-gray-900">
                      {user?.name || "User"}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {user?.subscription || "free"}
                    </span>
                  </div>
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <IconButton
                icon={mobileMenuOpen ? X : Menu}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              />
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-3 pt-3 pb-4 space-y-2">
              {/* Search on mobile */}
              <div className="px-2 pb-2">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Nav links */}
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive(item.path)
                        ? "text-primary-600 bg-primary-50"
                        : "text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* New Project (Mobile) */}
              <div className="px-2 pt-3">
                <Button
                  size="md"
                  icon={Plus}
                  onClick={() => {
                    navigate("/projects/new");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-center"
                >
                  New Project
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Overlay for user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
