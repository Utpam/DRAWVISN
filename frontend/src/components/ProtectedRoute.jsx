/**
 * ProtectedRoute.jsx — Authentication Guard
 *
 * Wraps routes that require authentication.
 * - Shows a full-screen spinner while the auth state is resolving.
 * - Redirects unauthenticated users to /login.
 * - Renders children for authenticated users.
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useFirebase";
import AppLoading from "./AppLoading";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AppLoading />;
  }

  if (!user) {
    // Preserve the attempted URL so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
