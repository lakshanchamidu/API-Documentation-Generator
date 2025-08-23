import React from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft, FileQuestion } from "lucide-react";
import Button from "../components/common/Button";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md w-full space-y-8">
        <div className="text-center">
          {/* 404 Illustration */}
          <div className="mx-auto flex items-center justify-center h-32 w-32 rounded-full bg-gray-100 mb-8">
            <FileQuestion className="h-16 w-16 text-gray-400" />
          </div>

          {/* Error Message */}
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-500 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Action Buttons */}
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Button
              onClick={() => window.history.back()}
              variant="secondary"
              icon={ArrowLeft}
              className="w-full sm:w-auto"
            >
              Go Back
            </Button>

            <Link to="/">
              <Button icon={Home} className="w-full sm:w-auto">
                Home Page
              </Button>
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Looking for something specific?
            </p>
            <div className="space-y-2">
              <Link
                to="/dashboard"
                className="block text-sm text-primary-600 hover:text-primary-500"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/projects"
                className="block text-sm text-primary-600 hover:text-primary-500"
              >
                View All Projects
              </Link>
              <a
                href="mailto:support@api-docs.com"
                className="block text-sm text-primary-600 hover:text-primary-500"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
