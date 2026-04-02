import { useRef, useState } from "react";

export const useCamera = () => {
    const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });  // Camera state
    const panRef = useRef({ active: false, startScreenX: 0, startScreenY: 0, startCameraX: 0, startCameraY: 0 });

    const screenToWorld = (screenX, screenY) => {
        return {
            x: screenX / camera.zoom + camera.x,
            y: screenY / camera.zoom + camera.y,
        };
    };

    const worldToScreen = (worldX, worldY) => {
        return {
            x: (worldX - camera.x) * camera.zoom,
            y: (worldY - camera.y) * camera.zoom,
        };
    };

    const startPan = (screenX, screenY) => {
        panRef.current = {
            active: true,
            startScreenX: screenX,
            startScreenY: screenY,
            startCameraX: camera.x,
            startCameraY: camera.y,
        };
    };

    const updatePan = (screenX, screenY) => {
        if (!panRef.current.active) return;

        const dx = (screenX - panRef.current.startScreenX) / camera.zoom;
        const dy = (screenY - panRef.current.startScreenY) / camera.zoom;

        setCamera(prev => ({
            ...prev,
            x: panRef.current.startCameraX - dx,
            y: panRef.current.startCameraY - dy,
        }));
    };

    const stopPan = () => {
        panRef.current.active = false;
    };

    const handleZoom = (e) => {
        e.preventDefault();

        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        setCamera(prev => {
            const nextZoom = Math.max(0.2, Math.min(5, prev.zoom * zoomFactor));
            return {
                ...prev,
                zoom: nextZoom,
            };
        });
    };

    return {
        camera,
        screenToWorld,
        worldToScreen,
        startPan,
        updatePan,
        stopPan,
        handleZoom,
    };
};

