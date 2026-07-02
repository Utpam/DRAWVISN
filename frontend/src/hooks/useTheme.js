/**
 * useTheme.js — Dark / Light Mode Hook
 *
 * Persists the user's theme choice in localStorage.
 * Applies `data-theme` attribute to <html> so CSS custom properties take effect globally.
 *
 * Usage:
 *   const { theme, toggleTheme, isDark } = useTheme();
 */

import { useState, useEffect } from "react";

const STORAGE_KEY = "dravisn-theme";
const DEFAULT_THEME = "dark";

export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_THEME;
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME;
  });

  // Keep the <html data-theme="..."> attribute in sync
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme(prev => (prev === "dark" ? "light" : "dark"));

  return {
    theme,
    isDark: theme === "dark",
    toggleTheme,
  };
};
