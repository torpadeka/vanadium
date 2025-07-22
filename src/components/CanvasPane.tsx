import React, {
    forwardRef,
    useRef,
    useState,
    useEffect,
    useImperativeHandle,
} from "react";
import html2canvas from "html2canvas-pro";
import {
    Square,
    Type,
    MousePointer,
    Trash2,
    Camera,
    CameraOff,
} from "lucide-react";

interface CanvasElement {
    id: string;
    type: "box" | "text";
    x: number;
    y: number;
    width: number;
    height: number;
    text?: string;
    color: string;
    isSelected?: boolean;
}

interface ResizeHandle {
    x: number;
    y: number;
    cursor: string;
    position: string;
}

type Tool = "select" | "box" | "text";

interface CanvasPaneProps {
    onCanvasCapture?: (dataUrl: string, description: string) => void;
    showPreview?: boolean;
    previewContent?: React.ReactNode;
    canvasRef?: React.RefObject<HTMLCanvasElement>;
}

export interface CanvasPaneHandle {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    localCanvasRef: React.RefObject<HTMLCanvasElement>;
    generateCanvasDescription: () => string;
    captureCanvas: () => Promise<{
        dataUrl: string | null;
        description: string;
    }>;
}

const CanvasPane = forwardRef<CanvasPaneHandle, CanvasPaneProps>(
    (
        { onCanvasCapture, showPreview = false, previewContent, canvasRef },
        ref
    ) => {
        const localCanvasRef = useRef<HTMLCanvasElement>(null);
        const previewRef = useRef<HTMLDivElement>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const toolbarRef = useRef<HTMLDivElement>(null);
        const [elements, setElements] = useState<CanvasElement[]>([]);
        const [selectedTool, setSelectedTool] = useState<Tool>("select");
        const [isDrawing, setIsDrawing] = useState(false);
        const [isDragging, setIsDragging] = useState(false);
        const [isResizing, setIsResizing] = useState(false);
        const [startPos, setStartPos] = useState({ x: 0, y: 0 });
        const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
        const [selectedElement, setSelectedElement] = useState<string | null>(
            null
        );
        const [resizeHandle, setResizeHandle] = useState<string | null>(null);
        const [editingText, setEditingText] = useState<string | null>(null);
        const [textInput, setTextInput] = useState("");
        const [canvasEnabled, setCanvasEnabled] = useState(true);
        const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
        const [toolbarHeight, setToolbarHeight] = useState(0);

        const generateCanvasDescription = (): string => {
            if (elements.length === 0) return "Empty canvas with preview";

            const descriptions = elements.map((element) => {
                const type = element.type === "box" ? "rectangle" : "text box";
                const position = `at position (${Math.round(element.x)}, ${Math.round(element.y)})`;
                const size = `with size ${Math.round(element.width)}x${Math.round(element.height)}`;
                const content = element.text
                    ? ` containing "${element.text}"`
                    : "";
                return `${type} ${position} ${size}${content}`;
            });

            return `Canvas with ${elements.length} element${elements.length !== 1 ? "s" : ""}: ${descriptions.join(", ")} and preview content`;
        };

        useImperativeHandle(
            ref,
            () => ({
                canvasRef: canvasRef || localCanvasRef,
                localCanvasRef,
                generateCanvasDescription,
                captureCanvas: async () => {
                    const container = containerRef.current;
                    if (container) {
                        try {
                            // Await the html2canvas promise
                            const canvasImage = await html2canvas(container, {
                                backgroundColor: null,
                                useCORS: true,
                                scale: window.devicePixelRatio,
                                width: container.clientWidth,
                                height: container.clientHeight,
                            });
                            const dataUrl = canvasImage.toDataURL("image/png");
                            const description = generateCanvasDescription();

                            // You can still call the optional onCanvasCapture prop
                            onCanvasCapture?.(dataUrl, description);

                            // Return the data directly
                            return { dataUrl, description };
                        } catch (error) {
                            console.error("html2canvas error:", error);
                            return { dataUrl: null, description: "" };
                        }
                    }
                    // Return null if the container doesn't exist
                    return { dataUrl: null, description: "" };
                },
            }),
            [
                canvasRef,
                localCanvasRef,
                generateCanvasDescription,
                onCanvasCapture,
            ]
        );

        useEffect(() => {
            const container = containerRef.current;
            const toolbar = toolbarRef.current;
            if (!container || !toolbar) return;

            const resizeObserver = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    const { width, height } = entry.contentRect;
                    setToolbarHeight(toolbar.offsetHeight);
                    const availableHeight = height - toolbarHeight;
                    setCanvasSize({
                        width: width, // Use full container width
                        height: Math.max(0, availableHeight),
                    });
                }
            });

            resizeObserver.observe(container);
            setToolbarHeight(toolbar.offsetHeight);
            const initialHeight = container.clientHeight - toolbarHeight;
            setCanvasSize({
                width: container.clientWidth,
                height: Math.max(0, initialHeight),
            });

            return () => resizeObserver.unobserve(container);
        }, []);

        useEffect(() => {
            redrawCanvas();
        }, [elements, selectedElement, canvasSize]);

        const redrawCanvas = () => {
            const canvas = canvasRef?.current || localCanvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            canvas.width = canvasSize.width;
            canvas.height = canvasSize.height - 70;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.globalAlpha = showPreview ? 0.9 : 1.0;

            elements.forEach((element) => {
                ctx.strokeStyle = showPreview ? element.color : element.color;
                ctx.fillStyle = showPreview
                    ? element.color + "60"
                    : element.color + "20";
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
                    ctx.fillStyle = showPreview ? element.color : element.color;
                    ctx.font = "14px Inter, sans-serif";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";

                    const words = element.text.split(" ");
                    const maxWidth = element.width - 16;
                    const lineHeight = 18;
                    let line = "";
                    let y =
                        element.y +
                        element.height / 2 -
                        (Math.ceil(words.length / 3) * lineHeight) / 2;

                    for (let n = 0; n < words.length; n++) {
                        const testLine = line + words[n] + " ";
                        const metrics = ctx.measureText(testLine);
                        const testWidth = metrics.width;

                        if (testWidth > maxWidth && n > 0) {
                            ctx.fillText(
                                line,
                                element.x + element.width / 2,
                                y
                            );
                            line = words[n] + " ";
                            y += lineHeight;
                        } else {
                            line = testLine;
                        }
                    }
                    ctx.fillText(line, element.x + element.width / 2, y);
                }

                if (selectedElement === element.id && canvasEnabled) {
                    drawSelectionHandles(ctx, element);
                }
            });

            ctx.globalAlpha = 1.0;
        };

        const drawSelectionHandles = (
            ctx: CanvasRenderingContext2D,
            element: CanvasElement
        ) => {
            const handleSize = 8;
            const handles = getResizeHandles(element);

            ctx.fillStyle = "#8B5CF6";
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 2;

            handles.forEach((handle) => {
                ctx.fillRect(
                    handle.x - handleSize / 2,
                    handle.y - handleSize / 2,
                    handleSize,
                    handleSize
                );
                ctx.strokeRect(
                    handle.x - handleSize / 2,
                    handle.y - handleSize / 2,
                    handleSize,
                    handleSize
                );
            });
        };

        const getResizeHandles = (element: CanvasElement): ResizeHandle[] => [
            { x: element.x, y: element.y, cursor: "nw-resize", position: "nw" },
            {
                x: element.x + element.width / 2,
                y: element.y,
                cursor: "n-resize",
                position: "n",
            },
            {
                x: element.x + element.width,
                y: element.y,
                cursor: "ne-resize",
                position: "ne",
            },
            {
                x: element.x + element.width,
                y: element.y + element.height / 2,
                cursor: "e-resize",
                position: "e",
            },
            {
                x: element.x + element.width,
                y: element.y + element.height,
                cursor: "se-resize",
                position: "se",
            },
            {
                x: element.x + element.width / 2,
                y: element.y + element.height,
                cursor: "s-resize",
                position: "s",
            },
            {
                x: element.x,
                y: element.y + element.height,
                cursor: "sw-resize",
                position: "sw",
            },
            {
                x: element.x,
                y: element.y + canvasSize.height / 2,
                cursor: "w-resize",
                position: "w",
            },
        ];

        const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
            const canvas = canvasRef?.current || localCanvasRef.current;
            if (!canvas) return { x: 0, y: 0 };

            const rect = canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };

        const findElementAt = (x: number, y: number): CanvasElement | null => {
            for (let i = elements.length - 1; i >= 0; i--) {
                const element = elements[i];
                if (
                    x >= element.x &&
                    x <= element.x + element.width &&
                    y >= element.y &&
                    y <= element.y + element.height
                ) {
                    return element;
                }
            }
            return null;
        };

        const findResizeHandle = (
            x: number,
            y: number,
            element: CanvasElement
        ): string | null => {
            const handles = getResizeHandles(element);
            const handleSize = 8;

            for (const handle of handles) {
                if (
                    x >= handle.x - handleSize / 2 &&
                    x <= handle.x + handleSize / 2 &&
                    y >= handle.y - handleSize / 2 &&
                    y <= handle.y + handleSize / 2
                ) {
                    return handle.position;
                }
            }
            return null;
        };

        const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (!canvasEnabled) return;

            const { x, y } = getMousePos(e);

            if (selectedTool === "select") {
                const selectedEl = selectedElement
                    ? elements.find((el) => el.id === selectedElement)
                    : null;

                if (selectedEl) {
                    const handle = findResizeHandle(x, y, selectedEl);
                    if (handle) {
                        setIsResizing(true);
                        setResizeHandle(handle);
                        setStartPos({ x, y });
                        return;
                    }
                }

                const clickedElement = findElementAt(x, y);
                if (clickedElement) {
                    setSelectedElement(clickedElement.id);
                    setIsDragging(true);
                    setDragOffset({
                        x: x - clickedElement.x,
                        y: y - clickedElement.y,
                    });
                } else {
                    setSelectedElement(null);
                }
            } else if (selectedTool === "box" || selectedTool === "text") {
                setIsDrawing(true);
                setStartPos({ x, y });
            }
        };

        const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (!canvasEnabled) return;

            const { x, y } = getMousePos(e);
            const canvas = canvasRef?.current || localCanvasRef.current;
            if (!canvas) return;

            if (isResizing && selectedElement && resizeHandle) {
                const selectedEl = elements.find(
                    (el) => el.id === selectedElement
                );
                if (selectedEl) {
                    const deltaX = x - startPos.x;
                    const deltaY = y - startPos.y;

                    let newX = selectedEl.x;
                    let newY = selectedEl.y;
                    let newWidth = selectedEl.width;
                    let newHeight = selectedEl.height;

                    switch (resizeHandle) {
                        case "nw":
                            newX += deltaX;
                            newY += deltaY;
                            newWidth -= deltaX;
                            newHeight -= deltaY;
                            break;
                        case "n":
                            newY += deltaY;
                            newHeight -= deltaY;
                            break;
                        case "ne":
                            newY += deltaY;
                            newWidth += deltaX;
                            newHeight -= deltaY;
                            break;
                        case "e":
                            newWidth += deltaX;
                            break;
                        case "se":
                            newWidth += deltaX;
                            newHeight += deltaY;
                            break;
                        case "s":
                            newHeight += deltaY;
                            break;
                        case "sw":
                            newX += deltaX;
                            newWidth -= deltaX;
                            newHeight += deltaY;
                            break;
                        case "w":
                            newX += deltaX;
                            newWidth -= deltaX;
                            break;
                    }

                    if (newWidth < 20) {
                        newWidth = 20;
                        if (resizeHandle.includes("w"))
                            newX = selectedEl.x + selectedEl.width - 20;
                    }
                    if (newHeight < 20) {
                        newHeight = 20;
                        if (resizeHandle.includes("n"))
                            newY = selectedEl.y + selectedEl.height - 20;
                    }

                    setElements((prev) =>
                        prev.map((el) =>
                            el.id === selectedElement
                                ? {
                                      ...el,
                                      x: newX,
                                      y: newY,
                                      width: newWidth,
                                      height: newHeight,
                                  }
                                : el
                        )
                    );
                    setStartPos({ x, y });
                }
            } else if (isDragging && selectedElement) {
                const newX = x - dragOffset.x;
                const newY = y - dragOffset.y;

                setElements((prev) =>
                    prev.map((el) =>
                        el.id === selectedElement
                            ? {
                                  ...el,
                                  x: Math.max(0, newX),
                                  y: Math.max(0, newY),
                              }
                            : el
                    )
                );
            } else if (isDrawing) {
                redrawCanvas();

                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.strokeStyle = "#8B5CF6";
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.strokeRect(
                        startPos.x,
                        startPos.y,
                        x - startPos.x,
                        y - startPos.y
                    );
                    ctx.setLineDash([]);
                }
            }
        };

        const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (!canvasEnabled) return;

            const { x, y } = getMousePos(e);

            if (isDrawing) {
                const width = Math.abs(x - startPos.x);
                const height = Math.abs(y - startPos.y);

                if (width > 10 && height > 10) {
                    const newElement: CanvasElement = {
                        id: Date.now().toString(),
                        type: selectedTool as "box" | "text",
                        x: Math.min(startPos.x, x),
                        y: Math.min(startPos.y, y),
                        width,
                        height,
                        text:
                            selectedTool === "text"
                                ? "Double-click to edit"
                                : undefined,
                        color: "#8B5CF6",
                    };

                    setElements((prev) => [...prev, newElement]);
                    setSelectedElement(newElement.id);
                }
            }

            setIsDrawing(false);
            setIsDragging(false);
            setIsResizing(false);
            setResizeHandle(null);
        };

        const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (!canvasEnabled || selectedTool !== "select") return;

            const { x, y } = getMousePos(e);
            const clickedElement = findElementAt(x, y);

            if (clickedElement && clickedElement.type === "text") {
                setEditingText(clickedElement.id);
                setTextInput(clickedElement.text || "");
            }
        };

        const handleTextSubmit = () => {
            if (editingText) {
                setElements((prev) =>
                    prev.map((el) =>
                        el.id === editingText ? { ...el, text: textInput } : el
                    )
                );
                setEditingText(null);
                setTextInput("");
            }
        };

        const deleteSelectedElement = () => {
            if (selectedElement) {
                setElements((prev) =>
                    prev.filter((el) => el.id !== selectedElement)
                );
                setSelectedElement(null);
            }
        };

        const clearCanvas = () => {
            setElements([]);
            setSelectedElement(null);
        };

        return (
            <div
                ref={containerRef}
                className="h-full bg-gray-950 flex flex-col"
            >
                <div
                    ref={toolbarRef}
                    className="border-b border-gray-800 p-4 flex items-center justify-between"
                >
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setSelectedTool("select")}
                            className={`p-2 rounded-lg transition-all ${selectedTool === "select" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                            title="Select"
                            disabled={!canvasEnabled}
                        >
                            <MousePointer className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setSelectedTool("box")}
                            className={`p-2 rounded-lg transition-all ${selectedTool === "box" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                            title="Rectangle"
                            disabled={!canvasEnabled}
                        >
                            <Square className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setSelectedTool("text")}
                            className={`p-2 rounded-lg transition-all ${selectedTool === "text" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                            title="Text Box"
                            disabled={!canvasEnabled}
                        >
                            <Type className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center space-x-2">
                        {selectedElement && canvasEnabled && (
                            <button
                                onClick={deleteSelectedElement}
                                className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                                title="Delete Selected"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={clearCanvas}
                            className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            disabled={!canvasEnabled}
                        >
                            Clear All
                        </button>
                    </div>
                </div>
                <div className="flex-1 relative overflow-hidden">
                    <div
                        ref={previewRef}
                        className="absolute inset-0 z-0 pointer-events-none"
                        style={{
                            width: canvasSize.width,
                            height: canvasSize.height,
                        }}
                    >
                        {previewContent}
                    </div>
                    <canvas
                        ref={canvasRef || localCanvasRef}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        className="absolute inset-0 cursor-crosshair bg-transparent"
                        style={{
                            opacity: canvasEnabled ? 0.9 : 0.3,
                            zIndex: 10,
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onDoubleClick={handleDoubleClick}
                    />
                    {editingText && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                                <h3 className="text-lg font-medium text-white mb-4">
                                    Edit Text
                                </h3>
                                <textarea
                                    value={textInput}
                                    onChange={(e) =>
                                        setTextInput(e.target.value)
                                    }
                                    className="w-80 h-32 p-3 bg-gray-900 border border-gray-600 rounded text-white resize-none"
                                    placeholder="Enter your text..."
                                    autoFocus
                                />
                                <div className="flex justify-end space-x-2 mt-4">
                                    <button
                                        onClick={() => {
                                            setEditingText(null);
                                            setTextInput("");
                                        }}
                                        className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleTextSubmit}
                                        className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {elements.length > 0 && !showPreview && (
                    <div className="border-t border-gray-800 p-4 max-h-40 overflow-y-auto">
                        <h3 className="text-sm font-medium text-gray-300 mb-2">
                            Elements ({elements.length})
                        </h3>
                        <div className="space-y-1">
                            {elements.map((element) => (
                                <div
                                    key={element.id}
                                    onClick={() =>
                                        canvasEnabled &&
                                        setSelectedElement(element.id)
                                    }
                                    className={`text-xs p-2 rounded cursor-pointer transition-colors flex items-center justify-between ${selectedElement === element.id ? "bg-purple-600/20 text-purple-200" : "text-gray-400 hover:bg-gray-800"}`}
                                >
                                    <div className="flex items-center">
                                        {element.type === "text" ? (
                                            <Type className="w-3 h-3 mr-2" />
                                        ) : (
                                            <Square className="w-3 h-3 mr-2" />
                                        )}
                                        <span>
                                            {element.text?.substring(0, 20) ||
                                                `${element.type} (${Math.round(element.width)}×${Math.round(element.height)})`}
                                            {element.text &&
                                                element.text.length > 20 &&
                                                "..."}
                                        </span>
                                    </div>
                                    {selectedElement === element.id &&
                                        canvasEnabled && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteSelectedElement();
                                                }}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {!showPreview && (
                    <div className="border-t border-gray-800 p-3 bg-gray-900">
                        <div className="text-xs text-gray-500 space-y-1">
                            <p>• Select tool and drag to create shapes</p>
                            <p>• Use Select tool to move and resize elements</p>
                            <p>• Double-click text boxes to edit content</p>
                            <p>
                                • Canvas content will be included when prompting
                                AI
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

export default CanvasPane;
