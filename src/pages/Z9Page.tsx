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
    File,
    Folder,
    FolderOpen,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CodeEditor from "@/components/ui/CodeEditor";
import PreviewPane from "@/components/PreviewPane";
import CanvasPane from "@/components/CanvasPane";
import ChatSidebar from "@/components/ChatSidebar";
import { useUser } from "@/context/AuthContext";
import { ChatSystemHandler } from "@/handler/ChatSystemHandler";
import {
    Chat,
    Message,
    ProjectVersion,
    File as ProjectFile,
    Folder as ProjectFolder,
} from "@/declarations/chat_system_service/chat_system_service.did";

type RightPanelTab = "code" | "preview" | "canvas";

interface ChatData {
    id: string;
    name: string;
    lastMessage?: string;
    timestamp: Date;
}

interface MessageData {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
}

interface FileTreeItem {
    id: number;
    name: string;
    type: "file" | "folder";
    content?: string;
    parentId?: number;
    children?: FileTreeItem[];
}

const Z9Page: React.FC = () => {
    const { user, principal, isAuthenticated } = useUser();
    const [activeRightTab, setActiveRightTab] = useState<RightPanelTab>("code");
    const [showChatSelector, setShowChatSelector] = useState(false);
    const [currentChatId, setCurrentChatId] = useState<number | null>(null);
    const [chats, setChats] = useState<ChatData[]>([]);
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [chatHandler] = useState(() => new ChatSystemHandler());
    const [currentVersion, setCurrentVersion] = useState<ProjectVersion | null>(
        null
    );
    const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
    const [projectFolders, setProjectFolders] = useState<ProjectFolder[]>([]);
    const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [webContainer, setWebContainer] = useState<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Default Vite React project files
    const defaultFiles = [
        {
            name: "package.json",
            content: `{
  "name": "vite-react-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "vite": "^4.4.5"
  }
}`,
        },
        {
            name: "index.html",
            content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
        },
        {
            name: "vite.config.js",
            content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
        },
        {
            name: "src/main.jsx",
            content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
        },
        {
            name: "src/App.jsx",
            content: `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App`,
        },
        {
            name: "src/App.css",
            content: `#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.App {
  padding: 2rem;
}

.card {
  padding: 2em;
}

.read-the-docs {
  color: #888;
}`,
        },
        {
            name: "src/index.css",
            content: `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}`,
        },
    ];

    // Initialize WebContainer
    useEffect(() => {
        const initWebContainer = async () => {
            try {
                const { auth } = await import("@webcontainer/api");
                await auth.init({
                    clientId:
                        "wc_api_torpadeka_a411a15978c06c356116d73259572b17",
                    scope: "",
                });

                const { WebContainer } = await import("@webcontainer/api");
                const container = await WebContainer.boot();
                setWebContainer(container);
            } catch (error) {
                console.error("Failed to initialize WebContainer:", error);
            }
        };

        initWebContainer();
    }, []);

    // Load chats on component mount
    useEffect(() => {
        if (isAuthenticated && principal) {
            loadChats();
        }
    }, [isAuthenticated, principal]);

    // Load chat data when currentChatId changes
    useEffect(() => {
        if (currentChatId) {
            loadChatData(currentChatId);
        }
    }, [currentChatId]);

    // Build file tree when files/folders change
    useEffect(() => {
        buildFileTree();
    }, [projectFiles, projectFolders]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadChats = async () => {
        if (!principal) return;

        try {
            const result = await chatHandler.getAllChatByUserId(principal);
            if ("ok" in result) {
                const chatData: ChatData[] = result.ok.map((chat: Chat) => ({
                    id: chat.id.toString(),
                    name: chat.title?.[0] || `Chat ${chat.id}`,
                    timestamp: new Date(Number(chat.createdAt) / 1000000),
                }));
                setChats(chatData);

                // If no current chat, select the first one or create new
                if (!currentChatId && chatData.length > 0) {
                    setCurrentChatId(Number(chatData[0].id));
                } else if (!currentChatId && chatData.length === 0) {
                    createNewChat();
                }
            }
        } catch (error) {
            console.error("Failed to load chats:", error);
        }
    };

    const createNewChat = async () => {
        try {
            const result = await chatHandler.createChat("New Project");
            if ("ok" in result) {
                const newChat = result.ok;
                setCurrentChatId(newChat.id);

                // Create initial project version with default files
                await createInitialProjectVersion(newChat.id);

                // Reload chats
                loadChats();
            }
        } catch (error) {
            console.error("Failed to create new chat:", error);
        }
    };

    const createInitialProjectVersion = async (chatId: number) => {
        try {
            // Create project version
            const versionResult = await chatHandler.createProjectVersion(
                chatId,
                1,
                JSON.stringify({ files: defaultFiles })
            );

            if ("ok" in versionResult) {
                const version = versionResult.ok;
                setCurrentVersion(version);

                // Create default files in the canister
                for (const file of defaultFiles) {
                    await chatHandler.createFile(
                        version.id,
                        undefined,
                        file.name,
                        file.content
                    );
                }
            }
        } catch (error) {
            console.error("Failed to create initial project version:", error);
        }
    };

    const loadChatData = async (chatId: number) => {
        setIsLoading(true);
        try {
            // Load messages
            const messagesResult =
                await chatHandler.getAllMessageByChatId(chatId);
            if ("ok" in messagesResult) {
                const messageData: MessageData[] = messagesResult.ok.map(
                    (msg: Message) => ({
                        id: msg.id.toString(),
                        content: msg.content,
                        isUser: "user" in msg.sender,
                        timestamp: new Date(Number(msg.createdAt) / 1000000),
                    })
                );
                setMessages(messageData);
            }

            // Load project versions
            const versionsResult =
                await chatHandler.getAllProjectVersionByChatId(chatId);
            if ("ok" in versionsResult && versionsResult.ok.length > 0) {
                const latestVersion =
                    versionsResult.ok[versionsResult.ok.length - 1];
                setCurrentVersion(latestVersion);

                // Load files and folders for this version
                await loadProjectFiles(latestVersion.id);
            }
        } catch (error) {
            console.error("Failed to load chat data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadProjectFiles = async (versionId: number) => {
        try {
            const [filesResult, foldersResult] = await Promise.all([
                chatHandler.getAllFileByProjectVersionId(versionId),
                chatHandler.getAllFolderByProjectVersionId(versionId),
            ]);

            if ("ok" in filesResult) {
                setProjectFiles(filesResult.ok);
                // Set first file as selected if none selected
                if (!selectedFile && filesResult.ok.length > 0) {
                    setSelectedFile(filesResult.ok[0]);
                }
            }

            if ("ok" in foldersResult) {
                setProjectFolders(foldersResult.ok);
            }
        } catch (error) {
            console.error("Failed to load project files:", error);
        }
    };

    const buildFileTree = () => {
        const tree: FileTreeItem[] = [];
        const folderMap = new Map<number, FileTreeItem>();

        // Create folder items
        projectFolders.forEach((folder) => {
            const folderItem: FileTreeItem = {
                id: folder.id,
                name: folder.name,
                type: "folder",
                parentId: folder.parentId?.[0],
                children: [],
            };
            folderMap.set(folder.id, folderItem);
        });

        // Create file items and organize tree
        projectFiles.forEach((file) => {
            const fileItem: FileTreeItem = {
                id: file.id,
                name: file.name,
                type: "file",
                content: file.content,
                parentId: file.folderId?.[0],
            };

            if (file.folderId?.[0]) {
                const parentFolder = folderMap.get(file.folderId[0]);
                if (parentFolder) {
                    parentFolder.children!.push(fileItem);
                }
            } else {
                tree.push(fileItem);
            }
        });

        // Add folders to tree
        projectFolders.forEach((folder) => {
            const folderItem = folderMap.get(folder.id);
            if (folderItem && !folder.parentId?.[0]) {
                tree.push(folderItem);
            } else if (folderItem && folder.parentId?.[0]) {
                const parentFolder = folderMap.get(folder.parentId[0]);
                if (parentFolder) {
                    parentFolder.children!.push(folderItem);
                }
            }
        });

        setFileTree(tree);
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !currentChatId) return;

        const userMessage: MessageData = {
            id: Date.now().toString(),
            content: inputMessage,
            isUser: true,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);

        // Save user message to canister
        try {
            await chatHandler.createMessage(
                currentChatId,
                { user: null },
                inputMessage,
                currentVersion?.id
            );
        } catch (error) {
            console.error("Failed to save user message:", error);
        }

        const currentInput = inputMessage;
        setInputMessage("");

        // Send to Azure GPT (placeholder implementation)
        try {
            const aiResponse = await sendToAzureGPT(currentInput);

            const aiMessage: MessageData = {
                id: (Date.now() + 1).toString(),
                content: aiResponse,
                isUser: false,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, aiMessage]);

            // Save AI message to canister
            await chatHandler.createMessage(
                currentChatId,
                { ai: null },
                aiResponse,
                currentVersion?.id
            );

            // TODO: Process AI response to extract and update code files
            // This is where we'll later implement code extraction and file updates
            await processAIResponse(aiResponse);
        } catch (error) {
            console.error("Failed to get AI response:", error);
            const errorMessage: MessageData = {
                id: (Date.now() + 2).toString(),
                content:
                    "Sorry, I encountered an error processing your request. Please try again.",
                isUser: false,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        }
    };

    const sendToAzureGPT = async (userInput: string): Promise<string> => {
        // Placeholder implementation for Azure GPT integration
        // TODO: Replace with actual Azure OpenAI API call

        const systemPrompt = `You are Z9, an AI assistant specialized in generating React applications with Vite. 
        You help users create, modify, and improve their React projects. When generating code, provide complete, 
        working files that can be directly used in a Vite React project. Always consider modern React best practices, 
        hooks, and functional components.`;

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Placeholder response - replace with actual Azure OpenAI API call
        return `I understand you want to ${userInput.toLowerCase()}. Here's what I can help you with:

\`\`\`jsx
// Example React component
import React, { useState } from 'react';

function ExampleComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h2>Generated Component</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default ExampleComponent;
\`\`\`

This is a placeholder response. The actual implementation will connect to Azure OpenAI and process your request to generate or modify React code based on your requirements.`;
    };

    const processAIResponse = async (response: string) => {
        // TODO: Implement code extraction and file updates
        // This function will:
        // 1. Parse the AI response to extract code blocks
        // 2. Identify which files need to be created/updated
        // 3. Update the canister with new/modified files
        // 4. Refresh the file tree and preview

        console.log("Processing AI response:", response);

        // Placeholder for future implementation
        // const codeBlocks = extractCodeBlocks(response);
        // for (const block of codeBlocks) {
        //   await updateOrCreateFile(block.filename, block.content);
        // }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleFileSelect = (file: ProjectFile) => {
        setSelectedFile(file);
    };

    const renderFileTree = (items: FileTreeItem[], level = 0) => {
        return items.map((item) => (
            <div key={item.id} style={{ marginLeft: level * 16 }}>
                <div
                    className={`flex items-center space-x-2 px-2 py-1 hover:bg-gray-800 cursor-pointer rounded ${
                        selectedFile?.id === item.id ? "bg-gray-700" : ""
                    }`}
                    onClick={() => {
                        if (item.type === "file") {
                            const file = projectFiles.find(
                                (f) => f.id === item.id
                            );
                            if (file) handleFileSelect(file);
                        }
                    }}
                >
                    {item.type === "folder" ? (
                        <FolderOpen className="w-4 h-4 text-blue-400" />
                    ) : (
                        <File className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm">{item.name}</span>
                </div>
                {item.children && renderFileTree(item.children, level + 1)}
            </div>
        ));
    };

    const renderRightPanel = () => {
        switch (activeRightTab) {
            case "code":
                return (
                    <div className="flex h-full">
                        {/* File Explorer */}
                        <div className="w-64 border-r border-gray-800 bg-gray-950 overflow-y-auto">
                            <div className="p-3 border-b border-gray-800">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-gray-300">
                                        Files
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                            <div className="p-2">
                                {isLoading ? (
                                    <div className="text-center text-gray-500 py-4">
                                        Loading...
                                    </div>
                                ) : (
                                    renderFileTree(fileTree)
                                )}
                            </div>
                        </div>

                        {/* Code Editor */}
                        <div className="flex-1">
                            {selectedFile ? (
                                <CodeEditor
                                    code={selectedFile.content}
                                    onChange={(newContent) => {
                                        // TODO: Implement file content updates
                                        console.log(
                                            "File content changed:",
                                            newContent
                                        );
                                    }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    Select a file to edit
                                </div>
                            )}
                        </div>
                    </div>
                );
            case "preview":
                return selectedFile ? (
                    <PreviewPane code={selectedFile.content} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Select a file to preview
                    </div>
                );
            case "canvas":
                return <CanvasPane />;
            default:
                return null;
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">
                        Authentication Required
                    </h1>
                    <p className="text-gray-400 mb-6">
                        Please log in to access the Z9 AI Assistant
                    </p>
                    <Button asChild>
                        <Link to="/login">Go to Login</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-black text-white flex">
            {/* Chat Selector Popup */}
            {showChatSelector && (
                <ChatSidebar
                    chats={chats}
                    currentChat={currentChatId?.toString() || ""}
                    onSelectChat={(chatId) => setCurrentChatId(Number(chatId))}
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
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={createNewChat}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            New
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Settings className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="text-gray-500">Loading chat...</div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex justify-start">
                            <div className="max-w-[80%] rounded-lg p-3 bg-gray-900 border border-gray-800">
                                <p className="text-sm leading-relaxed">
                                    Hello! I'm Z9, your AI assistant. What would
                                    you like to build today?
                                </p>
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => (
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
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {message.content}
                                    </p>
                                    <span className="text-xs opacity-70 mt-2 block">
                                        {message.timestamp.toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
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
                                disabled={!currentChatId}
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={
                                    !inputMessage.trim() || !currentChatId
                                }
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
