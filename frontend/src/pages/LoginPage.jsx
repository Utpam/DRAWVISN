/**
 * LoginPage.jsx — Google Sign-In Page
 *
 * Route: /login
 * Authenticated users are redirected immediately to /dashboard.
 * On successful login, redirects to the originally attempted route or /dashboard.
 */

import React, { useState } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useFirebase";

function LoginPage() {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState(null);

  // Where to go after login — defaults to dashboard
  const from = location.state?.from?.pathname ?? "/dashboard";

  // Already authenticated — no need to be here
  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  const handleLogin = async () => {
    setError(null);
    setSigningIn(true);
    try {
      await login();
      // Navigation happens via useEffect in AuthContext / ProtectedRoute redirect
    } catch (err) {
      console.error("[LoginPage] login error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in was cancelled. Please try again.");
      } else {
        setError("Sign-in failed. Please try again.");
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-indigo-600/8 blur-[100px]" />
      </div>

      {/* Logo */}
      <Link to="/" className="mb-10 flex items-center gap-2.5 group">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
          <span className="text-white font-black text-base">D</span>
        </div>
        <span className="text-2xl font-bold tracking-tight text-white">DRAVISN</span>
      </Link>

      {/* Card */}
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-gray-900/80 backdrop-blur-xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white text-center mb-1">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Sign in to access your boards
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Google sign-in button */}
        <button
          id="btn-google-signin"
          onClick={handleLogin}
          disabled={signingIn || loading}
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-white px-5 py-3.5 text-gray-900 font-semibold text-sm hover:bg-gray-50 active:bg-gray-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {signingIn ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
              Signing in…
            </>
          ) : (
            <>
              {/* Google Logo SVG */}
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.3 0 24 0 14.8 0 6.9 5.4 3 13.3l7.8 6C12.7 13 17.9 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z" />
                <path fill="#FBBC05" d="M10.8 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8.3-6.1z" />
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.2-8.4 2.2-6.1 0-11.3-4.1-13.2-9.9l-8.3 6.1C6.9 42.6 14.8 48 24 48z" />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <p className="mt-6 text-center text-xs text-gray-600">
          By signing in, you agree to our{" "}
          <span className="text-gray-500 hover:text-gray-400 cursor-pointer transition">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="text-gray-500 hover:text-gray-400 cursor-pointer transition">
            Privacy Policy
          </span>
          .
        </p>
      </div>

      {/* Back to home */}
      <Link
        to="/"
        className="mt-8 text-sm text-gray-600 hover:text-gray-400 transition"
      >
        ← Back to home
      </Link>
    </div>
  );
}

export default LoginPage;
