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
import { useTheme } from "../hooks/useTheme";
import ThemeToggle from "../components/ThemeToggle";
import "./LoginPage.css";

function LoginPage() {
  const { user, loading, login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
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
      } else if (err.code === "firebase/not-configured") {
        setError("Firebase is not configured. Add your Firebase web app settings to frontend/.env.");
      } else {
        setError("Sign-in failed. Please try again.");
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <main className="login-page">
      <ThemeToggle
        id="btn-toggle-theme"
        className="login-theme-toggle"
        isDark={isDark}
        onToggle={toggleTheme}
      />

      <Link to="/" className="login-brand">
        <span className="login-brand__mark" aria-hidden="true">D</span>
        <span>DRAVISN</span>
      </Link>

      <section className="login-card">
        <h1>
          Welcome back
        </h1>
        <p className="login-card__description">
          Sign in to access your boards
        </p>

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <button
          id="btn-google-signin"
          onClick={handleLogin}
          disabled={signingIn || loading}
          className="login-google-button"
        >
          {signingIn ? (
            <>
              <span className="login-spinner" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            <>
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

        {/* <p className="login-terms">
          By signing in, you agree to our{" "}
          <span>
            Terms of Service
          </span>{" "}
          and{" "}
          <span>
            Privacy Policy
          </span>
          .
        </p> */}
      </section>

      <Link
        to="/"
        className="login-back"
      >
        ← Back to home
      </Link>
    </main>
  );
}

export default LoginPage;
