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

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500" />
          <p className="text-sm text-gray-500 tracking-wide">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Preserve the attempted URL so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
