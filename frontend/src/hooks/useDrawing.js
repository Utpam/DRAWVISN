import { useRef } from "react";

export const useDrawing = (canvasRef, { shapes, setShapes, tool, setTextInput }, camera, renderers) => {
    const currentStroke = useRef(null);
    const isDrawingRef = useRef(false);
    const transformRef = useRef([])
    const startPos = useRef({ x: 0, y: 0 });  // reference for shapes
    const generateId = () => crypto.randomUUID();

    // Coords wrt canvas + camera transform
    const getCoords = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        if (camera?.screenToWorld) {
            return camera.screenToWorld(screenX, screenY);
        }

        return {
            x: screenX,
            y: screenY,
        };
    };

    //
    // *** START DRAWING ***
    //
    const startDrawing = (e) => {
    console.log(camera.camera);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d"); // Canvas Context
    
    const { x, y } = getCoords(e);

    if (tool === "rect") {
      startPos.current = { x, y };
      isDrawingRef.current = true;
      return;
    };

    if (tool === "circle") {
      startPos.current = { x, y };
      isDrawingRef.current = true;
      return;
    };

    if (tool === "line") {
      startPos.current = { x, y };
      isDrawingRef.current = true;
      return;
    };


    if (tool === "text") {
        const { x, y } = getCoords(e);
        setTextInput({
            x,
            y,
            value: ""
        });
        return;
    };

    if (tool === "pen") {
      currentStroke.current = {
        id: generateId(),
        type: "pen",
        points: [{ x, y }]
      };

      isDrawingRef.current = true;
      return;
    };

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();    // Starts a new stroke
    ctx.moveTo(x, y);   // Sets starting point
    // ctx.shadowForStrokeEnabled(false);
    isDrawingRef.current = true;
    };

    //
    // *** DRAWING ***
    //
    const draw = (e) => {
        if (!isDrawingRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const { x, y } = getCoords(e);

        // Set default context styles
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // RECTANGLE
        if (tool === "rect") {
            const { x: startX, y: startY } = startPos.current;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Apply camera transform for redrawing shapes
            ctx.setTransform(
                camera.camera.zoom,
                0,
                0,
                camera.camera.zoom,
                -camera.camera.x * camera.camera.zoom,
                -camera.camera.y * camera.camera.zoom
            );

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

            // Reset transform
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            return;
        }

        if(tool === "circle") {
            const { x: startX, y: startY } = startPos.current;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Apply camera transform for redrawing shapes
            ctx.setTransform(
                camera.camera.zoom,
                0,
                0,
                camera.camera.zoom,
                -camera.camera.x * camera.camera.zoom,
                -camera.camera.y * camera.camera.zoom
            );

            // redraw all saved shapes
            shapes.forEach(shape => {
                if (!shape || !shape.type || !renderers[shape.type]) return;
                renderers[shape.type](ctx, shape);
            });

            const dx = x - startX;
            const dy = y - startY;

            const previewCirlce = {
                type: "circle",
                x:  startX,
                y: startY,
                radius: Math.hypot(dx, dy),
            };
            renderers.circle(ctx, previewCirlce);

            // Reset transform
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            return;
        }

        // Line
        if(tool === "line") {
            const {x: startX, y:startY} = startPos.current; 
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Apply camera transform for redrawing shapes
            ctx.setTransform(
                camera.camera.zoom,
                0,
                0,
                camera.camera.zoom,
                -camera.camera.x * camera.camera.zoom,
                -camera.camera.y * camera.camera.zoom
            );

            // redraw all saved shapes
            shapes.forEach(shape => {
                if (!shape || !shape.type || !renderers[shape.type]) return;
                renderers[shape.type](ctx, shape);
            });
            
            const {x , y} = getCoords(e)

            const previewLine = {
                type: "line",
                x1: startX , 
                y1: startY, 
                x2: x, 
                y2: y, 
            }
            
            renderers.line(ctx, previewLine)

            // Reset transform
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            return;
        }

        // PEN
        if (tool === "pen") {
            const points = currentStroke.current.points;
            if (points.length === 0) return;
            
            const last = points[points.length - 1];

            const dx = x - last.x;
            const dy = y - last.y;
            const distance = Math.hypot(dx, dy);

            if (distance < 2) return; // ignore noise
            
            ctx.save();
            ctx.setTransform(
                camera.camera.zoom,
                0,
                0,
                camera.camera.zoom,
                -camera.camera.x * camera.camera.zoom,
                -camera.camera.y * camera.camera.zoom
            );
            ctx.beginPath();
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.restore();
            
            points.push({x, y});
            return;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
    }
    //
    // *** STOP DRAWING ***
    //
    const stopDrawing = (e) => {
        if (!isDrawingRef.current) return;

        if (tool === "pen") {
            if (currentStroke.current) { 
                setShapes(prev => [...prev, currentStroke.current]);
            }
        }

        if (tool === "rect") {
            const { x: startX, y: startY } = startPos.current;  // Initial mouse position when drawing started
            const { x, y } = getCoords(e);  // Mouse Position after stop    

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
        };

        if (tool === "circle") {
            const { x: startX, y: startY } = startPos.current;
            const { x, y } = getCoords(e);

            const dx = x - startX;
            const dy = y - startY;
            setShapes(prev => [
                ...prev,
                {
                    id: generateId(),
                    type: "circle",
                    x: startX,
                    y: startY,
                    radius: Math.hypot(dx, dy),
                },
            ]);
        };

        if (tool === "line") {
            const { x: startX, y: startY } = startPos.current;
            const { x, y } = getCoords(e);

            setShapes(prev => [
                ...prev,
                {
                    id: generateId(),
                    type: "line",
                    x1: startX,
                    y1: startY,
                    x2: x,
                    y2: y
                },
            ]);
        };
        isDrawingRef.current = false;

        console.log(shapes);
        
    };
    
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setShapes([]);
        console.log("clear", shapes)
    };

    // utils

    // const transformShape = () => {
    //     if(!transformRef) return;
    


    // }

    return {
        startDrawing,
        draw,
        stopDrawing,
        clearCanvas,
        getCoords,
        generateId
    }
}