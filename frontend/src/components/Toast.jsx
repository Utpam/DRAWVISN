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
    bar: "bg-emerald-500",
    icon_bg: "bg-emerald-500/20 text-emerald-400",
    border: "border-emerald-500/30",
  },
  error: {
    icon: "✕",
    bar: "bg-red-500",
    icon_bg: "bg-red-500/20 text-red-400",
    border: "border-red-500/30",
  },
  info: {
    icon: "i",
    bar: "bg-indigo-500",
    icon_bg: "bg-indigo-500/20 text-indigo-400",
    border: "border-indigo-500/30",
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
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
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
      className={`pointer-events-auto relative flex items-center gap-3 rounded-xl border ${v.border} bg-gray-900/95 backdrop-blur-sm px-4 py-3 shadow-2xl min-w-[280px] max-w-[380px] animate-slide-in`}
    >
      {/* Icon */}
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${v.icon_bg}`}
      >
        {v.icon}
      </span>

      {/* Message */}
      <p className="flex-1 text-sm text-gray-100 leading-snug">{t.message}</p>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(t.id)}
        className="ml-1 shrink-0 text-gray-500 hover:text-gray-300 transition text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-[3px] rounded-b-xl ${v.bar} animate-toast-progress`}
      />
    </div>
  );
}
