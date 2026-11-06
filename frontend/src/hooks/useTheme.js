/**
 * useTheme.js — Dark / Light Mode Hook
 *
 * Persists the user's theme choice in localStorage and supports system mode.
 * Applies `data-theme` attribute to <html> so CSS custom properties take effect globally.
 *
 * Usage:
 *   const { theme, setTheme, toggleTheme, isDark } = useTheme();
 */

import { useState, useEffect } from "react";

const STORAGE_KEY = "dravisn-theme";
const DEFAULT_THEME = "system";
const isValidTheme = (value) => ["dark", "light", "system"].includes(value);

export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_THEME;
    const storedTheme = localStorage.getItem(STORAGE_KEY);
    return isValidTheme(storedTheme) ? storedTheme : DEFAULT_THEME;
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => (
    typeof window === "undefined"
      ? true
      : window.matchMedia("(prefers-color-scheme: dark)").matches
  ));

  // Keep the <html data-theme="..."> attribute in sync
  useEffect(() => {
    const html = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (event) => setSystemPrefersDark(event.matches);

    html.setAttribute(
      "data-theme",
      theme === "system" ? (mediaQuery.matches ? "dark" : "light") : theme
    );
    localStorage.setItem(STORAGE_KEY, theme);

    if (theme === "system") {
      mediaQuery.addEventListener("change", handleSystemThemeChange);
      return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
    }
  }, [theme]);

  useEffect(() => {
    if (theme === "system") {
      document.documentElement.setAttribute(
        "data-theme",
        systemPrefersDark ? "dark" : "light"
      );
    }
  }, [theme, systemPrefersDark]);

  const isDark = theme === "dark" || (theme === "system" && systemPrefersDark);
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  };
};
