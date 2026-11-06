/**
 * Toast.jsx — Lightweight Toast Notification System
 *
 * Self-contained toast system with zero external dependencies.
 * Provides a hook (useToast) and a container component (ToastContainer).
 *
 * Usage:
 *   1. Mount <ToastContainer /> once near the root.
 *   2. Call useToast() in any component:
 *      const { toast } = useToast();
 *      toast.success("Board created!");
 *      toast.error("Board limit reached.");
 *      toast.info("Duplicating board...");
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const ToastContext = createContext(null);

// ---------------------------------------------------------------------------
// Variants — visual config per toast type
// ---------------------------------------------------------------------------
const VARIANTS = {
  success: {
    icon: "✓",
  },
  error: {
    icon: "✕",
  },
  info: {
    icon: "i",
  },
};

const AUTO_DISMISS_MS = 4000;

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, variant = "info") => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  const toast = {
    success: (msg) => show(msg, "success"),
    error: (msg) => show(msg, "error"),
    info: (msg) => show(msg, "info"),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
};

// ---------------------------------------------------------------------------
// ToastContainer — renders all active toasts
// ---------------------------------------------------------------------------
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div
      aria-live="polite"
      className="app-toast-stack"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ToastItem — individual toast card
// ---------------------------------------------------------------------------
function ToastItem({ toast: t, onDismiss }) {
  const v = VARIANTS[t.variant] ?? VARIANTS.info;

  return (
    <div
      role="alert"
      className="app-toast animate-slide-in"
      data-variant={t.variant}
    >
      <span className="app-toast__icon" aria-hidden="true">
        {v.icon}
      </span>
      <p className="app-toast__message">{t.message}</p>
      <button
        onClick={() => onDismiss(t.id)}
        className="app-toast__dismiss"
        aria-label="Dismiss"
      >
        ×
      </button>
      <div className="app-toast__progress animate-toast-progress" />
    </div>
  );
}
