/**
 * ForbiddenPage.jsx — 403 Access Denied
 *
 * Shown when a user attempts to access a board they don't own.
 */

import React from "react";
import { Link } from "react-router-dom";

function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
        <span className="text-4xl">🔒</span>
      </div>
      <h1 className="text-5xl font-black text-white mb-3 tracking-tight">403</h1>
      <p className="text-xl font-semibold text-gray-300 mb-2">Access Denied</p>
      <p className="text-gray-500 max-w-sm mb-10 leading-relaxed">
        You don't have permission to view this board. It may belong to another user.
      </p>
      <Link
        to="/dashboard"
        id="btn-go-to-dashboard"
        className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition"
      >
        Back to My Dashboard
      </Link>
    </div>
  );
}

export default ForbiddenPage;
