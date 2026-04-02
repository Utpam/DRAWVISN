import { useEffect } from "react";

export const useRenderer = (canvasRef, shapes, camera = { x: 0, y: 0, zoom: 1 }) => {

    const setupContextStyles = (ctx) => {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    };

    const renderers = {
        rect: (ctx, shape) => {
            setupContextStyles(ctx);
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        },
        
        pen: (ctx, shape) => {
            if (!shape || !shape.points || shape.points.length < 2) return;
            
            setupContextStyles(ctx);
            const points = shape.points;
            
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            
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
        },
        
        circle: (ctx, shape) => {
            setupContextStyles(ctx);
            ctx.beginPath(); 
            ctx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI)
            // ctx.ellipse(shape.x, shape.y, shape.radius, shape.radius * 1.5, 0, 0, 2 * Math.PI)
            ctx.stroke();
        },

        line: (ctx, shape) => {
            setupContextStyles(ctx);
            ctx.beginPath();
            ctx.moveTo(shape.x1, shape.y1);
            ctx.lineTo(shape.x2, shape.y2);
            ctx.stroke();
        },
    
        text: (ctx, shape) => {
            ctx.font = "16px Arial";
            ctx.fillStyle = "white";
            ctx.textBaseline = "top";
            ctx.fillText(shape.text, shape.x, shape.y);
        }
    };

    //   Update Canvas as Shapes are added
    useEffect(() => {
        const canvas = canvasRef?.current;
        if (!canvas) return; 
        const ctx = canvas.getContext("2d");

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // apply camera transform
        ctx.setTransform(
            camera.zoom,
            0,
            0,
            camera.zoom,
            -camera.x * camera.zoom,
            -camera.y * camera.zoom
        );

        shapes.forEach(shape => {
            if (!shape || !shape.type || !renderers[shape.type]) return;
            console.log(shape)
            const draw = renderers[shape.type];
            if (draw) {
                draw(ctx, shape);
                // ctx.stroke()
            }
        });

        // reset
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }, [shapes, camera]);    

    return {
        renderers
    }
}