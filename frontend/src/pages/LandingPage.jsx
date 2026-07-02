/**
 * LandingPage.jsx — Public Landing Page
 *
 * Shown to unauthenticated users at the root route "/".
 * Authenticated users are redirected to /dashboard immediately.
 */

import React from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useFirebase";

// Feature highlight data
const FEATURES = [
  {
    icon: "✦",
    title: "Infinite Canvas",
    desc: "Pan, zoom, and draw without limits. Your ideas deserve endless space.",
  },
  {
    icon: "⚡",
    title: "Instant Autosave",
    desc: "Every stroke is saved automatically. Never lose your work again.",
  },
  {
    icon: "🎨",
    title: "Rich Drawing Tools",
    desc: "Rectangles, ellipses, arrows, freehand, and text — all in one place.",
  },
  {
    icon: "📁",
    title: "Board Library",
    desc: "Organise, rename, duplicate, and manage all your boards from one dashboard.",
  },
  {
    icon: "🔒",
    title: "Private by Default",
    desc: "Your boards are yours alone. Collaboration features coming soon.",
  },
  {
    icon: "🚀",
    title: "Built to Scale",
    desc: "Architected for teams, real-time collaboration, and premium plans.",
  },
];

function LandingPage() {
  const { user, loading } = useAuth();

  // Redirect authenticated users straight to their dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* ------------------------------------------------------------------ */}
      {/* Navbar */}
      {/* ------------------------------------------------------------------ */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          {/* Logo mark */}
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">D</span>
          </div>
          <span className="text-xl font-bold tracking-tight">DRAVISN</span>
        </div>

        <Link
          to="/login"
          id="nav-signin-btn"
          className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold hover:bg-indigo-500 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25"
        >
          Sign In
        </Link>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Hero */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-28 pb-20">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-indigo-600/10 blur-[120px]" />
        </div>

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Now in Early Access
        </div>

        <h1 className="text-6xl font-black tracking-tighter leading-none mb-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent max-w-3xl">
          Your infinite<br />whiteboard.
        </h1>

        <p className="text-lg text-gray-400 max-w-xl leading-relaxed mb-10">
          Sketch, plan, and create on a canvas that never runs out of space.
          DRAVISN is the professional whiteboard built for makers.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            to="/login"
            id="hero-cta-btn"
            className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold hover:bg-indigo-500 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5"
          >
            Get Started — it's free
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>
          <span className="text-sm text-gray-500">No credit card required</span>
        </div>

        {/* Preview strip */}
        <div className="mt-20 w-full max-w-4xl mx-auto rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/50">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-gray-900/80">
            <span className="h-3 w-3 rounded-full bg-red-500/70" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
            <span className="ml-3 text-xs text-gray-600">dravisn.app — My Boards</span>
          </div>
          {/* Mock canvas grid */}
          <div className="h-56 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.06)_0%,_transparent_70%)] grid grid-cols-3 gap-4 p-6 opacity-80">
            {["Q4 Strategy", "UI Wireframes", "System Design"].map((title, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-gray-800/70 p-4 flex flex-col gap-2 hover:border-indigo-500/40 transition"
              >
                <div className="h-2 w-2/3 rounded-full bg-white/20" />
                <div className="h-1.5 w-1/2 rounded-full bg-white/10" />
                <div className="mt-auto text-xs text-gray-600 font-medium">{title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Features */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-8 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3 tracking-tight">
          Everything you need to think visually
        </h2>
        <p className="text-center text-gray-500 mb-14 text-base">
          A focused set of tools that stay out of your way.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-white/5 bg-gray-900/50 p-6 hover:border-indigo-500/30 hover:bg-gray-900 transition-all duration-300"
            >
              <div className="mb-4 text-2xl">{f.icon}</div>
              <h3 className="text-base font-semibold text-white mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA Footer */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-8 py-20 text-center border-t border-white/5">
        <h2 className="text-4xl font-black tracking-tighter mb-4 bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
          Start drawing today.
        </h2>
        <p className="text-gray-500 mb-8">Free plan includes 5 boards. Upgrade anytime.</p>
        <Link
          to="/login"
          id="footer-cta-btn"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold hover:bg-indigo-500 transition-all hover:shadow-xl hover:shadow-indigo-500/25"
        >
          Create your free account →
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 text-center text-xs text-gray-700 border-t border-white/5">
        © {new Date().getFullYear()} DRAVISN. All rights reserved.
      </footer>
    </div>
  );
}

export default LandingPage;
