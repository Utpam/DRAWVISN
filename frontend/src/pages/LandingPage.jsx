/**
 * LandingPage.jsx — Public Landing Page
 *
 * Shown to unauthenticated users at the root route "/".
 * Authenticated users are redirected to /dashboard immediately.
 */

import React, { useEffect, useRef } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useFirebase";
import { useTheme } from "../hooks/useTheme";
import ThemeToggle from "../components/ThemeToggle";
import "./LandingPage.css";

const FEATURES = [
  {
    icon: "canvas",
    title: "Room to think",
    desc: "Pan and zoom across an open canvas as your ideas take shape.",
  },
  {
    icon: "save",
    title: "Work stays saved",
    desc: "Your board changes are saved automatically as you work.",
  },
  {
    icon: "draw",
    title: "Tools that feel familiar",
    desc: "Sketch freely, add shapes and lines, or put a thought into words.",
  },
  {
    icon: "boards",
    title: "Boards in one place",
    desc: "Find, sort, rename, duplicate, and manage your boards from one view.",
  },
  {
    icon: "share",
    title: "Work together",
    desc: "Share a board and see collaborators work alongside you.",
  },
  {
    icon: "theme",
    title: "Make it comfortable",
    desc: "Choose a light or dark workspace and settle in to focus.",
  },
];

const ICON_PATHS = {
  canvas: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 3v18M3 8h5" /></>,
  save: <><path d="M5 3h12l4 4v14H3V3h2Z" /><path d="M7 3v6h10V3M7 21v-8h10v8" /></>,
  draw: <><path d="m4 16-.8 4.8L8 20l11-11-4-4L4 16Z" /><path d="m13.5 6.5 4 4M4 20h16" /></>,
  boards: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.7 10.6 6.6-4.2M8.7 13.4l6.6 4.2" /></>,
  theme: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
};

function FeatureIcon({ name }) {
  return (
    <span className="landing-feature__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">{ICON_PATHS[name]}</svg>
    </span>
  );
}

function LandingPage() {
  const { user, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const pageRef = useRef(null);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return undefined;

    const targets = page.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="landing-page" ref={pageRef}>
      <header className="landing-header">
        <Link to="/" className="landing-brand" aria-label="DRAVISN home">
          <span className="landing-brand__mark" aria-hidden="true">D</span>
          <span>DRAVISN</span>
        </Link>
        <nav className="landing-header__actions" aria-label="Main navigation">
          <ThemeToggle
            id="btn-toggle-theme"
            isDark={isDark}
            onToggle={toggleTheme}
          />
          <Link to="/login" id="nav-signin-btn" className="landing-signin">
            Sign in
          </Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero__copy">
          <p className="landing-kicker landing-enter">A whiteboard for the work in progress</p>
          <h1 className="landing-hero__title landing-enter landing-enter--title">
            Think it through.<br />
            <span>See where it goes.</span>
          </h1>
          <p className="landing-hero__description landing-enter landing-enter--description">
            A calm, open canvas for sketching ideas, mapping a plan, or working something out together.
          </p>
          <div className="landing-hero__actions landing-enter landing-enter--actions">
            <Link to="/login" id="hero-cta-btn" className="landing-primary-action">
              Open your workspace
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" /></svg>
            </Link>
            <span className="landing-plan-note">Free to get started</span>
          </div>
        </div>

        <div className="landing-workspace-preview landing-enter landing-enter--preview" aria-label="Preview of the DRAVISN board workspace">
          <div className="landing-preview__bar">
            <span className="landing-preview__brand"><span>D</span> DRAVISN</span>
            <span className="landing-preview__account">Workspace</span>
          </div>
          <div className="landing-preview__content">
            <div className="landing-preview__heading">
              <span>Boards</span>
              <span className="landing-preview__new">＋ New board</span>
            </div>
            <div className="landing-preview__cards">
              <div className="landing-preview-card">
                <div className="landing-preview-card__canvas">
                  <svg viewBox="0 0 220 124" aria-hidden="true">
                    <path d="M35 88 78 38l32 34 27-25 49 41" />
                    <circle cx="78" cy="38" r="4" />
                    <circle cx="137" cy="47" r="4" />
                  </svg>
                </div>
                <span>Untitled board</span>
                <small>Edited just now</small>
              </div>
              <div className="landing-preview-card">
                <div className="landing-preview-card__canvas landing-preview-card__canvas--notes">
                  <span />
                  <span />
                  <span />
                </div>
                <span>Project notes</span>
                <small>Edited yesterday</small>
              </div>
              <div className="landing-preview-card landing-preview-card--empty">
                <div className="landing-preview-card__canvas">
                  <span className="landing-preview-card__empty-icon">＋</span>
                </div>
                <span>Start with a blank board</span>
                <small>Make space for an idea</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features" aria-labelledby="landing-features-title">
        <header className="landing-section-heading" data-reveal>
          <p className="landing-kicker">The essentials</p>
          <h2 id="landing-features-title">Made for getting ideas out of your head.</h2>
        </header>
        <div className="landing-feature-grid">
          {FEATURES.map((feature, index) => (
            <article
              className="landing-feature"
              key={feature.title}
              data-reveal
              style={{ "--reveal-delay": `${Math.min(index % 3, 2) * 70}ms` }}
            >
              <FeatureIcon name={feature.icon} />
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-bottom-cta" data-reveal>
        <div>
          <p className="landing-kicker">Start with a blank board</p>
          <h2>Make room for your next idea.</h2>
        </div>
        <Link to="/login" id="footer-cta-btn" className="landing-primary-action">
          Create a free account
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" /></svg>
        </Link>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} DRAVISN</span>
        <span>A focused space for visual thinking.</span>
      </footer>
    </main>
  );
}

export default LandingPage;
