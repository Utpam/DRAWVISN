import { useState } from "react";

export const useCanvasState = () => {
    const [shapes, setShapes] = useState([]);
    const [tool, setTool] = useState("pen");
    const [textInput, setTextInput] = useState(null);

    return {
        shapes,
        setShapes,
        tool,
        setTool,
        textInput,
        setTextInput,
    }
}