import "./ThemeToggle.css";

function ThemeToggle({ isDark, onToggle, className = "", id }) {
  const nextTheme = isDark ? "light" : "dark";

  return (
    <button
      className={`theme-toggle ${className}`.trim()}
      id={id}
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        {isDark ? (
          <circle cx="10" cy="10" r="3.5" />
        ) : (
          <path d="M16.5 12.1A6.7 6.7 0 0 1 7.9 3.5 6.8 6.8 0 1 0 16.5 12.1Z" />
        )}
        {isDark && (
          <>
            <path d="M10 1.5v1.7M10 16.8v1.7M18.5 10h-1.7M3.2 10H1.5M16 4l-1.2 1.2M5.2 14.8 4 16M16 16l-1.2-1.2M5.2 5.2 4 4" />
          </>
        )}
      </svg>
      <span>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}

export default ThemeToggle;
