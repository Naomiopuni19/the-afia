import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StaffLogin from "./pages/StaffLogin";
import Booking from "./pages/Booking";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import Gallery from "./pages/Gallery";
import AdminMenuManager from "./pages/AdminMenuManager";
import ServiceRequests from "./pages/ServiceRequests";
import ForgotPassword  from "./pages/ForgotPassword";
import ResetPassword   from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC PAGES */}
        <Route path="/" element={<Home />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/staff-portal" element={<StaffLogin />} />

        {/* GUEST PAGES — auth optional for walk-ins, required for self-service users */}
        <Route path="/book" element={<Booking />} />
        <Route path="/welcome" element={<Welcome />} />

        {/* STAFF + ADMIN — both can access */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["admin", "staff"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/requests"
          element={
            <ProtectedRoute roles={["admin", "staff"]}>
              <ServiceRequests />
            </ProtectedRoute>
          }
        />

        {/* ADMIN ONLY — staff cannot access these */}
        <Route
          path="/admin/menu"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminMenuManager />
            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;