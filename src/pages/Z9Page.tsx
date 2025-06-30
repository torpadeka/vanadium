import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
    ArrowLeft,
    Send,
    Code,
    Eye,
    Palette,
    Menu,
    Plus,
    MessageSquare,
    Zap,
    Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CodeEditor from "@/components/ui/CodeEditor";
import PreviewPane from "@/components/PreviewPane";
import CanvasPane from "@/components/CanvasPane";
import ChatSidebar from "@/components/ChatSidebar";

type RightPanelTab = "code" | "preview" | "canvas";

interface Chat {
    id: string;
    name: string;
    lastMessage?: string;
    timestamp: Date;
}

interface Message {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
}

const Z9Page: React.FC = () => {
    const [activeRightTab, setActiveRightTab] = useState<RightPanelTab>("code");
    const [showChatSelector, setShowChatSelector] = useState(false);
    const [currentChat, setCurrentChat] = useState<string>("1");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            content:
                "Hello! I'm Z9, your AI assistant. What would you like to build today?",
            isUser: false,
            timestamp: new Date(),
        },
    ]);
    const [inputMessage, setInputMessage] = useState("");
    const [chats] = useState<Chat[]>([
        {
            id: "1",
            name: "New Project",
            lastMessage: "Hello! I'm Z9...",
            timestamp: new Date(),
        },
        {
            id: "2",
            name: "Todo App",
            lastMessage: "Creating a todo application...",
            timestamp: new Date(Date.now() - 86400000),
        },
        {
            id: "3",
            name: "Dashboard UI",
            lastMessage: "Building a dashboard...",
            timestamp: new Date(Date.now() - 172800000),
        },
    ]);

    const [code, setCode] = useState(`import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to your new React app!</h1>
        <p>Start building something amazing.</p>
      </header>
    </div>
  );
}

export default App;`);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputMessage.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            content: inputMessage,
            isUser: true,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setInputMessage("");

        // Simulate AI response
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                content:
                    "I understand you want to " +
                    inputMessage.toLowerCase() +
                    ". Let me help you with that! I'll generate the code for you.",
                isUser: false,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiResponse]);
        }, 1000);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const renderRightPanel = () => {
        switch (activeRightTab) {
            case "code":
                return <CodeEditor code={code} onChange={setCode} />;
            case "preview":
                return <PreviewPane code={code} />;
            case "canvas":
                return <CanvasPane />;
            default:
                return null;
        }
    };

    return (
        <div className="h-screen bg-black text-white flex">
            {/* Chat Selector Popup */}
            {showChatSelector && (
                <ChatSidebar
                    chats={chats}
                    currentChat={currentChat}
                    onSelectChat={setCurrentChat}
                    onClose={() => setShowChatSelector(false)}
                />
            )}

            {/* Chat Selector Button */}
            <Button
                onClick={() => setShowChatSelector(!showChatSelector)}
                className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50"
                variant="secondary"
                size="icon"
                title="Select Chat"
            >
                <Menu className="w-5 h-5" />
            </Button>

            {/* Left Panel - Chat */}
            <div className="w-1/2 border-r border-gray-800 flex flex-col">
                {/* Header */}
                <div className="border-b border-gray-800 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link to="/">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                        </Button>
                        <div className="flex items-center space-x-2">
                            <Zap className="w-6 h-6 text-purple-glow" />
                            <h1 className="text-xl font-semibold">
                                Z9 AI Assistant
                            </h1>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon">
                        <Settings className="w-5 h-5" />
                    </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                    message.isUser
                                        ? "bg-purple-glow text-white"
                                        : "bg-gray-900 border border-gray-800"
                                }`}
                            >
                                <p className="text-sm leading-relaxed">
                                    {message.content}
                                </p>
                                <span className="text-xs opacity-70 mt-2 block">
                                    {message.timestamp.toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-800 p-4">
                    <div className="flex space-x-3">
                        <div className="flex-1 relative">
                            <Textarea
                                value={inputMessage}
                                onChange={(e) =>
                                    setInputMessage(e.target.value)
                                }
                                onKeyPress={handleKeyPress}
                                placeholder="Describe what you want to build..."
                                className="pr-12 shadow-glow-sm focus:shadow-glow transition-shadow"
                                rows={2}
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!inputMessage.trim()}
                                size="icon"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8"
                                variant="ghost"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel */}
            <div className="w-1/2 flex flex-col">
                {/* Tab Navigation */}
                <div className="border-b border-gray-800 flex">
                    <TabButton
                        icon={<Code className="w-4 h-4" />}
                        label="Code"
                        active={activeRightTab === "code"}
                        onClick={() => setActiveRightTab("code")}
                    />
                    <TabButton
                        icon={<Eye className="w-4 h-4" />}
                        label="Preview"
                        active={activeRightTab === "preview"}
                        onClick={() => setActiveRightTab("preview")}
                    />
                    <TabButton
                        icon={<Palette className="w-4 h-4" />}
                        label="Canvas"
                        active={activeRightTab === "canvas"}
                        onClick={() => setActiveRightTab("canvas")}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {renderRightPanel()}
                </div>
            </div>
        </div>
    );
};

interface TabButtonProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({
    icon,
    label,
    active,
    onClick,
}) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-all ${
            active
                ? "border-purple-glow text-purple-glow bg-gray-900/50"
                : "border-transparent text-gray-400 hover:text-white hover:bg-gray-900/30"
        }`}
    >
        {icon}
        <span className="font-medium">{label}</span>
    </button>
);

export default Z9Page;
