import { useEffect } from "react";
import eraserCursor from "../assets/Icons/eraser-cursor.png";

const TOOL_GROUPS = [
  [
    {
      id: "selectBox",
      title: "Select",
      shortcut: "V",
      icon: <path d="M5 3l14 9-7 1-3 6z" />,
    },
    {
      id: "pen",
      title: "Pen",
      shortcut: "P",
      icon: <><path d="M12 19l7-7-3-3-7 7v3h3z" /><path d="m17.5 7.5-1-1a2 2 0 0 0-2.83 0L12 8.17" /></>,
    },
    {
      id: "eraser",
      title: "Eraser",
      shortcut: "E",
      icon: <><path d="M20 20H7l-4-4L14 5l6 6-3.5 3.5" /><path d="m6 11 7 7" /></>,
    },
  ],
  [
    {
      id: "rect",
      title: "Rectangle",
      shortcut: "R",
      icon: <rect x="4" y="4" width="16" height="16" rx="2" />,
    },
    {
      id: "circle",
      title: "Ellipse",
      shortcut: "C",
      icon: <circle cx="12" cy="12" r="8" />,
    },
    {
      id: "line",
      title: "Line",
      shortcut: "L",
      icon: <line x1="5" y1="19" x2="19" y2="5" />,
    },
  ],
  [
    {
      id: "text",
      title: "Text",
      shortcut: "T",
      icon: <><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></>,
    },
  ],
];

function Toolbar({ setTool, tool }) {
  useEffect(() => {
    const previousCursor = document.body.style.cursor;
    const cursors = {
      eraser: `url('${eraserCursor}') 0 50, auto`,
      pen: "crosshair",
      rect: "crosshair",
      circle: "crosshair",
      line: "crosshair",
      text: "text",
      selectBox: "default",
    };
    document.body.style.cursor = cursors[tool] ?? "default";
    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [tool]);

  useEffect(() => {
    const shortcuts = {
      v: "selectBox",
      p: "pen",
      e: "eraser",
      r: "rect",
      c: "circle",
      l: "line",
      t: "text",
    };
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) return;
      const nextTool = shortcuts[event.key.toLowerCase()];
      if (nextTool) {
        event.preventDefault();
        setTool(nextTool);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setTool]);

  return (
    <div className="drawing-tools" role="toolbar" aria-label="Drawing tools">
      {TOOL_GROUPS.map((group, groupIndex) => (
        <div className="drawing-tools__group" key={groupIndex}>
          {group.map(({ id, title, shortcut, icon }) => (
            <button
              key={id}
              id={`tool-${id}`}
              className={`drawing-tool${tool === id ? " is-active" : ""}`}
              type="button"
              title={`${title} (${shortcut})`}
              aria-label={`${title} tool (${shortcut})`}
              aria-pressed={tool === id}
              onClick={() => setTool(id)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">{icon}</svg>
              <span className="drawing-tool__tooltip" role="tooltip">
                {title}<kbd>{shortcut}</kbd>
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export { Toolbar };
