import { useRef, useState, useEffect } from "react";

export const useCanvas = () => {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });  // reference for shapes
  const currentStroke = useRef(null);
  const generateId = () => crypto.randomUUID();

  const [shapes, setShapes] = useState([]);
  const [tool, setTool] = useState("pen");

  // Coords wrt canvas
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const renderers = {
    rect: (ctx, shape) => {
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    },

    pen: (ctx, shape) => {
      if (!shape || !shape.points || shape.points.length < 2) return;

      const points = shape.points;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 1; i < points.length - 1; i++) {
        const midX = (points[i].x + points[i + 1].x) / 2;
        const midY = (points[i].y + points[i + 1].y) / 2;

        ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
      }

      ctx.lineTo(
        points[points.length - 1].x,
        points[points.length - 1].y
      );

      ctx.stroke();
    }
  };

  
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d"); // Canvas Context

    const { x, y } = getCoords(e);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    if (tool === "rect") {
      startPos.current = { x, y };
      isDrawingRef.current = true;
      return;
    }

    if (tool === "pen") {
      currentStroke.current = {
        id: generateId(),
        type: "pen",
        points: [{ x, y }]
      };

      isDrawingRef.current = true;
      return;
    }

    ctx.beginPath();    // Starts a new stroke
    ctx.moveTo(x, y);   // Sets starting point
    // ctx.shadowForStrokeEnabled(false);
    isDrawingRef.current = true;
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const { x, y } = getCoords(e);

    // RECTANGLE
    if (tool === "rect") {
      const { x: startX, y: startY } = startPos.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // redraw all saved shapes
      shapes.forEach(shape => {
        if (!shape || !shape.type || !renderers[shape.type]) return;
        renderers[shape.type](ctx, shape);
      });

      // preview current rectangle
      const previewRect = {
        type: "rect",
        x: startX,
        y: startY,
        width: x - startX,
        height: y - startY
      };

      renderers.rect(ctx, previewRect);

      return;
    }

    // PEN
    if (tool === "pen") {
      // currentStroke.current.points.push({ x, y });
      const points = currentStroke.current.points;
      const last = points[points.length - 1];

      const dx = x - last.x;
      const dy = y - last.y;

      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 2) return; // ignore noise
      
      points.push({x, y})
      if(!points) return;

      ctx.beginPath();

      for (let i = 0; i < points.length - 1; i++) {
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
      }

      ctx.stroke();

      return;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  }

  const stopDrawing = (e) => {
    if (!isDrawingRef.current) return;

    if (tool === "pen") {
      if (currentStroke.current) { 
        setShapes(prev => [...prev, currentStroke.current]);
      }
    }

    if (tool === "rect") {
      const { x: startX, y: startY } = startPos.current;
      const { x, y } = getCoords(e);

      setShapes(prev => [
        ...prev,
        {
          id: generateId(),
          type: "rect",
          x: startX,
          y: startY,
          width: x - startX,
          height: y - startY,
        },
      ]);
    }

    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    setShapes([]);
  };

    //   Update Canvas as Shapes are added
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return; 
      const ctx = canvas.getContext("2d");

      console.log("Shapes: ",shapes)
      console.log("Shapes:", JSON.stringify(shapes, null, 2));

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      shapes.forEach(shape => {
        if (!shape || !shape.type) return;

        const draw = renderers[shape.type];
        if (draw) {
          draw(ctx, shape);
        }
      });

    }, [shapes]);

  return {
    canvasRef,
    tool,
    shapes,
    renderers,
    startDrawing,
    draw,
    stopDrawing,
    setTool,
    clearCanvas,
    getCoords,
  };
};
