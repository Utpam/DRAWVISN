/**
 * NotFoundPage.jsx — 404 Not Found
 *
 * Shown for any unmatched route.
 */

import React from "react";
import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <main className="app-status">
      <span className="app-status__mark" aria-hidden="true">404</span>
      <h1 className="app-status__code">404</h1>
      <p className="app-status__title">Page not found</p>
      <p className="app-status__copy">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        id="btn-go-home"
        className="app-status__action"
      >
        Go to Home
      </Link>
    </main>
  );
}

export default NotFoundPage;
