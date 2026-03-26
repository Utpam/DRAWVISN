import pen from "../assets/Icons/pencil.png";
import eraser from "../assets/Icons/eraser.png";

function Toolbar({ setTool }) {
    const tools = ["pen", "rect"];
    const baseStyle = "w-[70px] p-1 m-1 rounded-md text-white font-bold transition";
    const icons = [
        {
            title: "pen",
            link: pen
        },

    ]


    return (
    <>
        {tools.map(t => (
            <button key={t} onClick={() => setTool(t)} className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-800">
                <img src={t in icons} className="w-10 aspect-square" />
            </button>
        ))}
    </>
    );
}

export { Toolbar };