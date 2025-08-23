import React from "react";
import { Link, Navigate } from "react-router-dom";
import {
  FileText,
  Code,
  Users,
  Zap,
  Globe,
  Shield,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  // If user is authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    {
      icon: FileText,
      title: "Beautiful Documentation",
      description:
        "Create stunning, interactive API documentation that developers love to use.",
    },
    {
      icon: Code,
      title: "API Testing",
      description:
        "Test your endpoints directly from the documentation with built-in testing tools.",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description:
        "Invite team members and collaborate on your API documentation in real-time.",
    },
    {
      icon: Zap,
      title: "Auto Import",
      description:
        "Import from Postman collections or OpenAPI specifications in seconds.",
    },
    {
      icon: Globe,
      title: "Public Sharing",
      description:
        "Share your documentation with the world or keep it private to your team.",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee.",
    },
  ];

  const benefits = [
    "Create unlimited projects",
    "Import from Postman & OpenAPI",
    "Real-time collaboration",
    "Interactive API testing",
    "Custom branding & themes",
    "Analytics & insights",
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <FileText className="w-8 h-8 text-primary-600" />
              <span className="font-bold text-xl text-gray-900">
                API Docs Generator
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-gray-900">
                Features
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-gray-900">
                Pricing
              </a>
              <a href="#docs" className="text-gray-700 hover:text-gray-900">
                Docs
              </a>
              <Link to="/login" className="text-gray-700 hover:text-gray-900">
                Sign In
              </Link>
              <Link to="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl">
            Create Beautiful
            <span className="text-primary-600"> API Documentation</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Build, share, and maintain stunning API documentation that
            developers actually want to use. Import from Postman, test
            endpoints, and collaborate with your team.
          </p>

          <div className="mt-10 flex justify-center space-x-4">
            <Link to="/register">
              <Button size="lg" icon={ArrowRight} iconPosition="right">
                Start Building for Free
              </Button>
            </Link>
            <Button variant="secondary" size="lg">
              View Demo
            </Button>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Free forever • No credit card required • 5-minute setup
          </p>
        </div>

        {/* Hero Image */}
        <div className="mt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
              <div className="p-8">
                <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Beautiful Documentation Preview
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Everything you need to document your API
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Powerful features to create, maintain, and share your API
              documentation
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Why choose our platform?
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Join thousands of developers who trust our platform for their
                API documentation needs.
              </p>

              <ul className="mt-8 space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link to="/register">
                  <Button size="lg">Get Started Today</Button>
                </Link>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-8 h-96 flex items-center justify-center">
              <div className="text-center">
                <Code className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                <p className="text-gray-600">Interactive Demo Placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to create amazing API documentation?
          </h2>
          <p className="mt-4 text-xl text-primary-100">
            Join thousands of developers already using our platform
          </p>

          <div className="mt-8">
            <Link to="/register">
              <Button variant="secondary" size="lg">
                Start Building for Free
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-primary-200">
            No credit card required • Free forever plan available
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-6 h-6 text-primary-600" />
                <span className="font-bold">API Docs</span>
              </div>
              <p className="text-gray-400 text-sm">
                Create beautiful API documentation that developers love.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Examples
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 API Docs Generator. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
