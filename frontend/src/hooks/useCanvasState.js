import { useState } from "react";
import { DEFAULT_STYLE } from "../styles/defaultStyle";

export const useCanvasState = () => {
    const [shapes, setShapes] = useState([]);
    const [tool, setTool] = useState("pen");
    const [textInput, setTextInput] = useState(null);
    const [selectionBox, setSelctionBox] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [zoom, setZoom] = useState(1);

    /** The style applied to every NEW shape drawn from this point forward */
    const [currentStyle, setCurrentStyle] = useState({ ...DEFAULT_STYLE });

    return {
        shapes,
        setShapes,
        tool,
        setTool,
        textInput,
        setTextInput,
        selectionBox,
        setSelctionBox,
        selectedIds,
        setSelectedIds,
        zoom,
        setZoom,
        currentStyle,
        setCurrentStyle,
    };
};