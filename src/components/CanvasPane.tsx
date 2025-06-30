import React, { useRef, useState, useEffect } from "react";
import { Square, Type, MousePointer } from "lucide-react";

interface CanvasElement {
    id: string;
    type: "box" | "text";
    x: number;
    y: number;
    width: number;
    height: number;
    text?: string;
    color: string;
}

type Tool = "select" | "box" | "text";

const CanvasPane: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [elements, setElements] = useState<CanvasElement[]>([]);
    const [selectedTool, setSelectedTool] = useState<Tool>("select");
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [selectedElement, setSelectedElement] = useState<string | null>(null);

    useEffect(() => {
        redrawCanvas();
    }, [elements, selectedElement]);

    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw elements
        elements.forEach((element) => {
            ctx.strokeStyle = element.color;
            ctx.fillStyle = element.color + "20";
            ctx.lineWidth = selectedElement === element.id ? 3 : 2;

            if (element.type === "box") {
                ctx.fillRect(
                    element.x,
                    element.y,
                    element.width,
                    element.height
                );
                ctx.strokeRect(
                    element.x,
                    element.y,
                    element.width,
                    element.height
                );
            }

            if (element.text) {
                ctx.fillStyle = element.color;
                ctx.font = "14px Inter, sans-serif";
                ctx.fillText(
                    element.text,
                    element.x + 8,
                    element.y + element.height / 2 + 5
                );
            }
        });
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (selectedTool === "select") {
            // Find clicked element
            const clickedElement = elements.find(
                (el) =>
                    x >= el.x &&
                    x <= el.x + el.width &&
                    y >= el.y &&
                    y <= el.y + el.height
            );
            setSelectedElement(clickedElement?.id || null);
        } else if (selectedTool === "box" || selectedTool === "text") {
            setIsDrawing(true);
            setStartPos({ x, y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        // Draw preview rectangle
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        redrawCanvas();

        ctx.strokeStyle = "#8B5CF6";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
            startPos.x,
            startPos.y,
            currentX - startPos.x,
            currentY - startPos.y
        );
        ctx.setLineDash([]);
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;

        const width = Math.abs(endX - startPos.x);
        const height = Math.abs(endY - startPos.y);

        if (width > 10 && height > 10) {
            const newElement: CanvasElement = {
                id: Date.now().toString(),
                type: selectedTool as "box" | "text",
                x: Math.min(startPos.x, endX),
                y: Math.min(startPos.y, endY),
                width,
                height,
                text: selectedTool === "text" ? "Click to edit" : undefined,
                color: "#8B5CF6",
            };

            setElements((prev) => [...prev, newElement]);
        }

        setIsDrawing(false);
    };

    const handleElementDoubleClick = (elementId: string) => {
        const element = elements.find((el) => el.id === elementId);
        if (!element || element.type !== "text") return;

        const newText = prompt("Enter text:", element.text || "");
        if (newText !== null) {
            setElements((prev) =>
                prev.map((el) =>
                    el.id === elementId ? { ...el, text: newText } : el
                )
            );
        }
    };

    return (
        <div className="h-full bg-gray-950 flex flex-col">
            {/* Toolbar */}
            <div className="border-b border-gray-800 p-4 flex items-center space-x-4">
                <button
                    onClick={() => setSelectedTool("select")}
                    className={`p-2 rounded-lg transition-all ${
                        selectedTool === "select"
                            ? "bg-purple-glow text-white"
                            : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                    title="Select"
                >
                    <MousePointer className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setSelectedTool("box")}
                    className={`p-2 rounded-lg transition-all ${
                        selectedTool === "box"
                            ? "bg-purple-glow text-white"
                            : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                    title="Rectangle"
                >
                    <Square className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setSelectedTool("text")}
                    className={`p-2 rounded-lg transition-all ${
                        selectedTool === "text"
                            ? "bg-purple-glow text-white"
                            : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                    title="Text Box"
                >
                    <Type className="w-4 h-4" />
                </button>
                <div className="h-6 w-px bg-gray-700"></div>
                <button
                    onClick={() => setElements([])}
                    className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                    Clear All
                </button>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="absolute inset-0 cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onDoubleClick={(e) => {
                        if (selectedElement) {
                            handleElementDoubleClick(selectedElement);
                        }
                    }}
                />
            </div>

            {/* Element List */}
            {elements.length > 0 && (
                <div className="border-t border-gray-800 p-4 max-h-32 overflow-y-auto">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">
                        Elements
                    </h3>
                    <div className="space-y-1">
                        {elements.map((element) => (
                            <div
                                key={element.id}
                                onClick={() => setSelectedElement(element.id)}
                                className={`text-xs p-2 rounded cursor-pointer transition-colors ${
                                    selectedElement === element.id
                                        ? "bg-purple-glow/20 text-purple-200"
                                        : "text-gray-400 hover:bg-gray-800"
                                }`}
                            >
                                {element.type === "text" ? (
                                    <Type className="w-3 h-3 inline mr-2" />
                                ) : (
                                    <Square className="w-3 h-3 inline mr-2" />
                                )}
                                {element.text ||
                                    `${element.type} (${Math.round(element.width)}×${Math.round(element.height)})`}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CanvasPane;
