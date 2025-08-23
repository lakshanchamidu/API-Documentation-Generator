import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/LoginPage";
import Register from "./pages/RegisterPage";
import Dashboard from "./pages/DashboardPage";
import ProjectDetails from "./pages/ProjectDetails";
import EndpointDetails from "./pages/EndpointDetails";
import TestCaseDetails from "./pages/TestCaseDetails";
import DocsViewer from "./pages/DocsViewer";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/endpoints/:id" element={<EndpointDetails />} />
        <Route path="/tests/:id" element={<TestCaseDetails />} />
        <Route path="/docs" element={<DocsViewer />} />
      </Routes>
    </Router>
  );
}

export default App;
