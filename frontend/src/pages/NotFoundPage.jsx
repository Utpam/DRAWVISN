/**
 * NotFoundPage.jsx — 404 Not Found
 *
 * Shown for any unmatched route.
 */

import React from "react";
import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-800 border border-gray-700">
        <span className="text-4xl">🗺️</span>
      </div>
      <h1 className="text-5xl font-black text-white mb-3 tracking-tight">404</h1>
      <p className="text-xl font-semibold text-gray-300 mb-2">Page Not Found</p>
      <p className="text-gray-500 max-w-sm mb-10 leading-relaxed">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        id="btn-go-home"
        className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition"
      >
        Go to Home
      </Link>
    </div>
  );
}

export default NotFoundPage;
