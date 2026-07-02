import { useRef } from "react";
import { useDrawing } from "./useDrawing";
import { useCanvasState } from "./useCanvasState";
import { useRenderer } from "./useRenderer";
import { useCamera } from "./useCamera";

export const useCanvas = () => {

  const canvasRef = useRef(null);
  const state = useCanvasState();
  const camera = useCamera()
  const { renderers } = useRenderer(canvasRef, state.shapes, camera.camera, state.selectedIds);
  const drawing = useDrawing(canvasRef, state, camera, renderers);

  return {
    canvasRef,
    ...state,
    ...drawing,
    ...camera,
    renderers,
  };
};
