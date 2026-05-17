import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

/**
 * Usage:
 *   <ProtectedRoute roles={["admin"]}>...</ProtectedRoute>
 *   <ProtectedRoute roles={["admin","staff"]}>...</ProtectedRoute>
 *   <ProtectedRoute roles={["guest"]}>...</ProtectedRoute>
 *   <ProtectedRoute>...</ProtectedRoute>   (any logged-in user)
 */
const ProtectedRoute = ({ children, roles = null }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        setRole(session.user.user_metadata?.role || "guest");
      }
      setLoading(false);
    };
    checkAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user || null);
      setRole(session?.user?.user_metadata?.role || null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        background: "#020617", color: "#3b82f6", minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Inter', sans-serif", letterSpacing: 2, fontSize: 12
      }}>
        VERIFYING ACCESS...
      </div>
    );
  }

  if (!user) {
    const wantsStaff = roles && (roles.includes("admin") || roles.includes("staff"));
    return <Navigate to={wantsStaff ? "/staff-portal" : "/login"} replace />;
  }

  if (roles && !roles.includes(role)) {
    if (role === "admin" || role === "staff") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/welcome" replace />;
  }

  return children;
};

export default ProtectedRoute;