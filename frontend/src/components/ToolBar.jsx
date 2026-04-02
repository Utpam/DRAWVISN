function Toolbar({ setTool, tool }) {
    const toolIcons = {
        pen: "✏️",
        rect: "🟨",
        circle: "⭕",
        text: "T",
        line: "/",
        eraser: "💊"
    };
    const tools = ["pen", "eraser", "rect", "circle", "line", "text"];
    const baseStyle = ` w-[70px] p-1 m-1 rounded-md text-white font-bold transition active:bg-red-600 `;


    return (
    <>
        {tools.map(t => (
            <button key={t} onClick={() => setTool(t)} className={`bg-blue-600 text-white p-2 rounded-md w-[50px] text-center hover:bg-blue-800 ${tool === t ? "bg-black" : ""}`}>
                {toolIcons[t]}
            </button>
        ))}
    </>
    );
}

export { Toolbar };