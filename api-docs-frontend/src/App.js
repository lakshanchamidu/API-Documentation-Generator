import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/common/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Page imports
import HomePage from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ProjectNewPage from "./pages/ProjectsNewPage";
import EndpointsPage from "./pages/EndpointsPage";
import EndpointNewPage from "./pages/EndpointNewPage";
import EndpointEditPage from "./pages/EndpointEditPage";
import DocumentationPage from "./pages/DocumentationPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes with layout */}
            <Route element={<Layout />}>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <ProjectsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/projects/new"
                element={
                  <ProtectedRoute>
                    <ProjectNewPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/projects/:id"
                element={
                  <ProtectedRoute>
                    <ProjectDetailPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/projects/:projectId/endpoints"
                element={
                  <ProtectedRoute>
                    <EndpointsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/projects/:projectId/endpoints/new"
                element={
                  <ProtectedRoute>
                    <EndpointNewPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/projects/:projectId/endpoints/:id/edit"
                element={
                  <ProtectedRoute>
                    <EndpointEditPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/projects/:id/docs"
                element={
                  <ProtectedRoute>
                    <DocumentationPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Redirect from /home to /dashboard for authenticated users */}
            <Route
              path="/home"
              element={<Navigate to="/dashboard" replace />}
            />

            {/* 404 page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
