/**
 * ForbiddenPage.jsx — 403 Access Denied
 *
 * Shown when a user attempts to access a board they don't own.
 */

import React from "react";
import { Link } from "react-router-dom";

function ForbiddenPage() {
  return (
    <main className="app-status">
      <span className="app-status__mark" aria-hidden="true">403</span>
      <h1 className="app-status__code">403</h1>
      <p className="app-status__title">Access denied</p>
      <p className="app-status__copy">
        You don't have permission to view this board. It may belong to another user.
      </p>
      <Link
        to="/dashboard"
        id="btn-go-to-dashboard"
        className="app-status__action"
      >
        Back to My Dashboard
      </Link>
    </main>
  );
}

export default ForbiddenPage;
