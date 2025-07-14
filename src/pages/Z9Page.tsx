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
    ChevronRight,
    ChevronDown,
    FileText,
    FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { WebContainer } from "@webcontainer/api";

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
    isExpanded?: boolean;
}

let webContainerInstance: WebContainer | null = null;

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
    const [isInitializing, setIsInitializing] = useState(true);
    const [isChatDataLoaded, setIsChatDataLoaded] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<Set<number>>(
        new Set()
    );
    const [showNewFileDialog, setShowNewFileDialog] = useState(false);
    const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
    const [newItemName, setNewItemName] = useState("");
    const [newItemParentId, setNewItemParentId] = useState<
        number | undefined
    >();
    const [webContainer, setWebContainer] = useState<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showProjectEditor, setShowProjectEditor] = useState(false);
    const [renderKey, setRenderKey] = useState(0);

    // DEBUG
    useEffect(() => {
        console.log("State Update:", {
            showProjectEditor,
            currentChatId,
            chats: chats.length,
            projectFiles: projectFiles.length,
            projectFolders: projectFolders.length,
            isLoading,
            isInitializing,
        });
    }, [
        showProjectEditor,
        currentChatId,
        chats,
        projectFiles,
        projectFolders,
        isLoading,
        isInitializing,
    ]);

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

    useEffect(() => {
        let mounted = true;

        const initializeWebContainer = async () => {
            if (webContainer) {
                console.log(
                    "WebContainer already initialized, reusing instance"
                );
                return;
            }

            console.log("Booting WebContainer...");
            try {
                const instance = await WebContainer.boot();
                if (mounted) {
                    setWebContainer(instance);
                    console.log("WebContainer initialized:", instance);
                    await instance.fs.mkdir("src", { recursive: true });
                    console.log("Created src directory in WebContainer");

                    for (const file of defaultFiles) {
                        await instance.fs.writeFile(file.name, file.content);
                        console.log(`Wrote file: ${file.name}`);
                    }
                }
            } catch (error) {
                console.error("Failed to boot WebContainer:", error);
                if (mounted) {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: Date.now().toString(),
                            content:
                                "Failed to initialize WebContainer. Please try again.",
                            isUser: false,
                            timestamp: new Date(),
                        },
                    ]);
                }
            }
        };

        if (isAuthenticated && principal) {
            initializeWebContainer();
        }

        return () => {
            mounted = false;
            if (webContainer) {
                webContainer.teardown();
                console.log("WebContainer torn down");
            }
        };
    }, [isAuthenticated, principal]); // Removed webContainer from dependencies

    useEffect(() => {
        const initializeApp = async () => {
            try {
                await loadChats();
            } catch (error) {
                console.error("Failed to initialize app:", error);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now().toString(),
                        content: "Failed to initialize app. Please try again.",
                        isUser: false,
                        timestamp: new Date(),
                    },
                ]);
            } finally {
                setIsInitializing(false);
            }
        };

        if (isAuthenticated && principal && isInitializing) {
            console.log("Principal ready:", principal.toString());
            initializeApp();
        }
    }, [isAuthenticated, principal, isInitializing]);

    const buildFileTree = () => {
        const tree: FileTreeItem[] = [];
        const folderMap = new Map<number, FileTreeItem>();
        const fileMap = new Map<number, FileTreeItem>();

        // Create folder items
        projectFolders.forEach((folder) => {
            const folderItem: FileTreeItem = {
                id: folder.id,
                name: folder.name,
                type: "folder",
                parentId: folder.parentId?.[0],
                children: [], // Ensure children is always initialized
                isExpanded: expandedFolders.has(folder.id),
            };
            folderMap.set(folder.id, folderItem);
            console.log(
                `Folder: ${folder.name}, id: ${folder.id}, parentId: ${folder.parentId?.[0] || "none"}`
            );
        });

        // Create file items and link to folders
        projectFiles.forEach((file) => {
            const fileItem: FileTreeItem = {
                id: file.id,
                name: file.name,
                type: "file",
                content: file.content,
                parentId: file.folderId?.[0],
            };
            fileMap.set(file.id, fileItem);
            console.log(
                `File: ${file.name}, id: ${file.id}, folderId: ${file.folderId?.[0] || "none"}`
            );

            if (file.folderId?.[0]) {
                const parentFolder = folderMap.get(file.folderId[0]);
                if (parentFolder) {
                    parentFolder.children = parentFolder.children || [];
                    parentFolder.children.push(fileItem);
                } else {
                    console.warn(
                        `No folder found for file ${file.name} with folderId ${file.folderId?.[0]}`
                    );
                    tree.push(fileItem);
                }
            } else {
                tree.push(fileItem);
            }
        });

        // Build the tree by adding folders
        projectFolders.forEach((folder) => {
            const folderItem = folderMap.get(folder.id);
            if (folderItem && !folder.parentId?.[0]) {
                tree.push(folderItem);
            } else if (folderItem && folder.parentId?.[0]) {
                const parentFolder = folderMap.get(folder.parentId[0]);
                if (parentFolder) {
                    parentFolder.children = parentFolder.children || [];
                    parentFolder.children.push(folderItem);
                } else {
                    console.warn(
                        `No parent folder found for folder ${folder.name} with parentId ${folder.parentId?.[0]}`
                    );
                }
            }
        });

        // Sort children for consistency
        tree.forEach((item) => {
            if (item.children) {
                item.children.sort((a, b) => a.name.localeCompare(b.name));
            }
        });

        setFileTree(tree);
        console.log(
            "Built file tree with children:",
            tree.map((item) => ({
                name: item.name,
                children: item.children?.map((c) => c.name) || [],
            }))
        );
    };

    // Build file tree when files/folders change
    useEffect(() => {
        buildFileTree();
    }, [projectFiles, projectFolders]);

    // Load chat data when currentChatId changes
    useEffect(() => {
        if (currentChatId) {
            setShowProjectEditor(true);
            loadChatData(currentChatId)
                .then(() => {
                    setIsChatDataLoaded(true);
                })
                .catch((error) => {
                    console.error("Failed to load chat data in effect:", error);
                    setIsChatDataLoaded(false);
                    setShowProjectEditor(false); // Revert only on failure
                });
        } else {
            setIsChatDataLoaded(false);
            setShowProjectEditor(false);
        }
    }, [currentChatId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diffInHours = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60)
        );

        if (diffInHours < 1) return "Just now";
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
        return date.toLocaleDateString();
    };

    const initializeApp = async () => {
        try {
            await loadChats();
        } catch (error) {
            console.error("Failed to initialize app:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    content: "Failed to initialize app. Please try again.",
                    isUser: false,
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsInitializing(false);
        }
    };

    const loadChats = async () => {
        if (!principal) {
            console.error("No principal available for loading chats");
            return;
        }

        try {
            const result = await chatHandler.getAllChatByUserId(principal);
            if ("ok" in result) {
                const chatData: ChatData[] = result.ok.map((chat: Chat) => ({
                    id: chat.id.toString(),
                    name: chat.title?.[0] || `Chat ${chat.id}`,
                    timestamp: new Date(Number(chat.createdAt) / 1000000),
                }));
                setChats(chatData);
                console.log("Chats loaded:", chatData);
            } else {
                console.error("Failed to load chats: Invalid response", result);
                setChats([]);
            }
        } catch (error) {
            console.error("Failed to load chats:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    content: "Failed to load projects. Please try again.",
                    isUser: false,
                    timestamp: new Date(),
                },
            ]);
        }
    };

    const createNewChat = async () => {
        if (!principal) {
            console.error("No principal available for creating chat");
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    content: "Authentication error. Please log in again.",
                    isUser: false,
                    timestamp: new Date(),
                },
            ]);
            return;
        }

        if (!webContainer) {
            console.warn(
                "WebContainer not ready, waiting for initialization..."
            );
            await new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (webContainer) {
                        clearInterval(interval);
                        resolve(null);
                    }
                }, 100);
            });
        }

        try {
            setIsLoading(true);
            const result = await chatHandler.createChat("New Project");
            if ("ok" in result) {
                const newChat = result.ok;
                console.log("New chat created:", newChat.id);

                // Create initial project version
                await createInitialProjectVersion(Number(newChat.id));

                // Update state after successful creation
                setCurrentChatId(Number(newChat.id));
                setShowProjectEditor(true);

                // Update chats list
                const newChatData: ChatData = {
                    id: newChat.id.toString(),
                    name: newChat.title?.[0] || `Chat ${newChat.id}`,
                    timestamp: new Date(Number(newChat.createdAt) / 1000000),
                };
                setChats((prev) => [...prev, newChatData]);

                // Force re-render to ensure UI updates
                setRenderKey((prev) => prev + 1);

                // Force reload chats to ensure backend sync
                await loadChats();
            } else {
                console.error(
                    "Failed to create chat: Invalid response",
                    result
                );
                throw new Error("Invalid response from createChat");
            }
        } catch (error) {
            console.error("Failed to create new chat:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    content: "Failed to create new project. Please try again.",
                    isUser: false,
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectProject = async (chatId: string) => {
        try {
            setIsLoading(true);
            const numericChatId = Number(chatId);
            if (isNaN(numericChatId)) throw new Error("Invalid chat ID");
            setCurrentChatId(numericChatId);
            setShowProjectEditor(true);
            setShowChatSelector(false);
            await loadChatData(numericChatId);
        } catch (error) {
            console.error("Failed to select project:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    content: "Failed to open project. Please try again.",
                    isUser: false,
                    timestamp: new Date(),
                },
            ]);
            setShowProjectEditor(false);
            setCurrentChatId(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewProject = async () => {
        try {
            await createNewChat();
            setShowChatSelector(false);
        } catch (error) {
            console.error("Failed to handle new project:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    content: "Failed to create new project. Please try again.",
                    isUser: false,
                    timestamp: new Date(),
                },
            ]);
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
                console.log("Loaded files:", filesResult.ok); // Debug log
                if (!selectedFile && filesResult.ok.length > 0) {
                    setSelectedFile(filesResult.ok[0]);
                }
            }

            if ("ok" in foldersResult) {
                setProjectFolders(foldersResult.ok);
                console.log("Loaded folders:", foldersResult.ok); // Debug log
            }
        } catch (error) {
            console.error("Failed to load project files:", error);
        }
    };

    const createInitialProjectVersion = async (chatId: number) => {
        try {
            const versionResult = await chatHandler.createProjectVersion(
                chatId,
                1,
                JSON.stringify({ files: defaultFiles })
            );

            if ("ok" in versionResult) {
                const version = versionResult.ok;
                setCurrentVersion(version);
                console.log("Project version created:", version.id);

                let srcFolderId: number | undefined;
                const srcFolderResult = await chatHandler.createFolder(
                    version.id,
                    "src",
                    undefined
                );
                if ("ok" in srcFolderResult) {
                    srcFolderId = srcFolderResult.ok.id;
                    console.log("Src folder created:", srcFolderId);
                } else {
                    console.error(
                        "Failed to create src folder:",
                        srcFolderResult
                    );
                    throw new Error("Failed to create src folder");
                }

                // In createInitialProjectVersion, update the file loop
                for (const file of defaultFiles) {
                    const isInSrc = file.name.startsWith("src/");
                    const fileName = isInSrc
                        ? file.name.replace("src/", "")
                        : file.name;
                    const folderId = isInSrc ? srcFolderId : undefined;
                    const webContainerPath = file.name; // Use original path

                    const fileResult = await chatHandler.createFile(
                        version.id,
                        folderId,
                        fileName,
                        file.content
                    );
                    if ("ok" in fileResult) {
                        console.log(`File created in canister: ${fileName}`);
                        if (webContainer) {
                            try {
                                await webContainer.fs.writeFile(
                                    webContainerPath,
                                    file.content
                                );
                                console.log(
                                    `File written to WebContainer: ${webContainerPath}`
                                );
                            } catch (error) {
                                console.error(
                                    `Failed to write ${fileName} to WebContainer:`,
                                    error
                                );
                            }
                        }
                    } else {
                        console.error(
                            `Failed to create file ${fileName}:`,
                            fileResult
                        );
                        throw new Error(`Failed to create file ${fileName}`);
                    }
                }

                await loadProjectFiles(version.id);
            } else {
                console.error(
                    "Failed to create project version:",
                    versionResult
                );
                throw new Error("Failed to create project version");
            }
        } catch (error) {
            console.error("Failed to create initial project version:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    content:
                        "Failed to initialize project files. Please try again.",
                    isUser: false,
                    timestamp: new Date(),
                },
            ]);
            throw error;
        }
    };

    // Project Selection Screen Component
    const ProjectSelectionScreen = () => (
        <div className="h-screen bg-black text-white flex items-center justify-center">
            <div className="max-w-4xl mx-auto px-6 text-center">
                <div className="mb-8">
                    <Zap className="w-16 h-16 text-purple-glow mx-auto mb-6" />
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-purple-glow to-purple-600 bg-clip-text text-transparent">
                        Z9 AI Assistant
                    </h1>
                    <p className="text-xl text-gray-300 mb-8">
                        Create stunning React applications with the power of AI
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {/* Create New Project */}
                    <div
                        onClick={handleNewProject}
                        className="bg-gray-900 border border-gray-800 rounded-xl p-8 hover:border-purple-glow hover:shadow-glow transition-all cursor-pointer group"
                    >
                        <div className="text-purple-glow mb-4 group-hover:scale-110 transition-transform">
                            <Plus className="w-12 h-12 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                            New Project
                        </h3>
                        <p className="text-gray-400">
                            Start fresh with a new React application
                        </p>
                    </div>

                    {/* Open Existing Project */}
                    <div
                        onClick={() => setShowChatSelector(true)}
                        className="bg-gray-900 border border-gray-800 rounded-xl p-8 hover:border-purple-glow hover:shadow-glow transition-all cursor-pointer group"
                    >
                        <div className="text-purple-glow mb-4 group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-12 h-12 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                            Open Project
                        </h3>
                        <p className="text-gray-400">
                            Continue working on an existing project
                        </p>
                        {chats.length > 0 && (
                            <div className="mt-3 text-sm text-purple-400">
                                {chats.length} project
                                {chats.length !== 1 ? "s" : ""} available
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Projects */}
                {chats.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-semibold mb-6">
                            Recent Projects
                        </h2>
                        <div className="grid gap-4 max-w-3xl mx-auto">
                            {chats.slice(0, 3).map((chat) => (
                                <div
                                    key={chat.id}
                                    onClick={() => handleSelectProject(chat.id)}
                                    className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-600 hover:bg-gray-800 transition-all cursor-pointer flex items-center justify-between"
                                >
                                    <div className="flex items-center space-x-3">
                                        <MessageSquare className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <h3 className="font-medium">
                                                {chat.name}
                                            </h3>
                                            <p className="text-sm text-gray-400">
                                                {formatTimestamp(
                                                    chat.timestamp
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        Open
                                    </Button>
                                </div>
                            ))}
                        </div>
                        {chats.length > 3 && (
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => setShowChatSelector(true)}
                            >
                                View All Projects ({chats.length})
                            </Button>
                        )}
                    </div>
                )}

                {/* Back to Home */}
                <div className="mt-12">
                    <Button variant="ghost" asChild>
                        <Link to="/">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );

    const loadChatData = async (chatId: number) => {
        setIsLoading(true);
        try {
            console.log("Loading chat data for chatId:", chatId); // Debug log
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
                console.log("Messages loaded:", messageData.length);
            } else {
                console.error("Failed to load messages:", messagesResult);
            }

            const versionsResult =
                await chatHandler.getAllProjectVersionByChatId(chatId);
            if ("ok" in versionsResult && versionsResult.ok.length > 0) {
                const latestVersion =
                    versionsResult.ok[versionsResult.ok.length - 1];
                setCurrentVersion(latestVersion);
                console.log("Project version loaded:", latestVersion.id);
                await loadProjectFiles(latestVersion.id);
            } else {
                console.error("No project versions found for chat:", chatId);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now().toString(),
                        content:
                            "No project data found for this chat. Creating a new version...",
                        isUser: false,
                        timestamp: new Date(),
                    },
                ]);
                // Optionally create a default version if none exists
                await createInitialProjectVersion(chatId);
            }
        } catch (error) {
            console.error("Failed to load chat data:", error);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    content: "Failed to load project data. Please try again.",
                    isUser: false,
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // Update the rendering condition
    if (
        !isAuthenticated ||
        isInitializing ||
        (!showProjectEditor && !isChatDataLoaded) ||
        currentChatId === null
    ) {
        return (
            <>
                {isLoading && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                        <div className="text-white">Creating project...</div>
                    </div>
                )}
                {showChatSelector && (
                    <ChatSidebar
                        chats={chats}
                        currentChat={currentChatId?.toString() || ""}
                        onSelectChat={handleSelectProject}
                        onClose={() => setShowChatSelector(false)}
                        onNewProject={handleNewProject}
                    />
                )}
                <ProjectSelectionScreen />
            </>
        );
    }

    const toggleFolder = (folderId: number) => {
        setExpandedFolders((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(folderId)) {
                newSet.delete(folderId);
            } else {
                newSet.add(folderId);
            }
            return newSet;
        });
    };

    const handleCreateFile = async () => {
        if (!newItemName.trim() || !currentVersion) return;

        try {
            const result = await chatHandler.createFile(
                currentVersion.id,
                newItemParentId,
                newItemName,
                "// New file\n"
            );

            if ("ok" in result) {
                await loadProjectFiles(currentVersion.id);
                setShowNewFileDialog(false);
                setNewItemName("");
                setNewItemParentId(undefined);
            }
        } catch (error) {
            console.error("Failed to create file:", error);
        }
    };

    const handleCreateFolder = async () => {
        if (!newItemName.trim() || !currentVersion) return;

        try {
            const result = await chatHandler.createFolder(
                currentVersion.id,
                newItemName,
                newItemParentId
            );

            if ("ok" in result) {
                await loadProjectFiles(currentVersion.id);
                setExpandedFolders((prev) => new Set([...prev, result.ok.id]));
                setShowNewFolderDialog(false);
                setNewItemName("");
                setNewItemParentId(undefined);
            }
        } catch (error) {
            console.error("Failed to create folder:", error);
        }
    };

    const updateFileContent = async (fileId: number, newContent: string) => {
        try {
            const result = await chatHandler.updateFile(
                fileId,
                undefined,
                undefined,
                newContent
            );

            if ("ok" in result) {
                // Update the local state
                setProjectFiles((prev) =>
                    prev.map((file) =>
                        file.id === fileId
                            ? { ...file, content: newContent }
                            : file
                    )
                );

                // Update selected file if it's the one being edited
                if (selectedFile?.id === fileId) {
                    setSelectedFile((prev) =>
                        prev ? { ...prev, content: newContent } : null
                    );
                }
            }
        } catch (error) {
            console.error("Failed to update file:", error);
        }
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
            <div key={item.id}>
                <div
                    className={`flex items-center space-x-1 px-2 py-1 hover:bg-gray-800 cursor-pointer rounded ${
                        selectedFile?.id === item.id ? "bg-gray-700" : ""
                    }`}
                    style={{ marginLeft: level * 16 }}
                    onClick={() => {
                        if (item.type === "folder") {
                            toggleFolder(item.id);
                        } else {
                            const file = projectFiles.find(
                                (f) => f.id === item.id
                            );
                            if (file) handleFileSelect(file);
                        }
                    }}
                >
                    {item.type === "folder" ? (
                        <>
                            {item.isExpanded ? (
                                <ChevronDown className="w-3 h-3 text-gray-400" />
                            ) : (
                                <ChevronRight className="w-3 h-3 text-gray-400" />
                            )}
                            {item.isExpanded ? (
                                <FolderOpen className="w-4 h-4 text-blue-400" />
                            ) : (
                                <Folder className="w-4 h-4 text-blue-400" />
                            )}
                        </>
                    ) : (
                        <>
                            <div className="w-3 h-3" />{" "}
                            {/* Spacer for alignment */}
                            <FileText className="w-4 h-4 text-gray-400" />
                        </>
                    )}
                    <span className="text-sm">{item.name}</span>
                </div>
                {item.type === "folder" &&
                    item.isExpanded &&
                    item.children &&
                    renderFileTree(item.children, level + 1)}
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
                                    <div className="flex space-x-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() =>
                                                setShowNewFileDialog(true)
                                            }
                                            title="New File"
                                        >
                                            <FileText className="w-3 h-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() =>
                                                setShowNewFolderDialog(true)
                                            }
                                            title="New Folder"
                                        >
                                            <FolderPlus className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-2">
                                {isLoading || isInitializing ? (
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
                                    onChange={(newContent) =>
                                        updateFileContent(
                                            selectedFile.id,
                                            newContent
                                        )
                                    }
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
                    <PreviewPane
                        code={selectedFile.content}
                        webContainer={webContainer}
                    />
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

    if (
        !isAuthenticated ||
        isInitializing ||
        (!showProjectEditor && !isChatDataLoaded) ||
        currentChatId === null
    ) {
        return (
            <div className="h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    {!isAuthenticated ? (
                        <>
                            <h1 className="text-2xl font-bold mb-4">
                                Authentication Required
                            </h1>
                            <p className="text-gray-400 mb-6">
                                Please log in to access the Z9 AI Assistant
                            </p>
                            <Button asChild>
                                <Link to="/login">Go to Login</Link>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Zap className="w-12 h-12 text-purple-glow mx-auto mb-4 animate-pulse" />
                            <h1 className="text-2xl font-bold mb-4">
                                Initializing Z9...
                            </h1>
                            <p className="text-gray-400">
                                Setting up your workspace
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    if (!showProjectEditor || currentChatId === null) {
        return (
            <>
                {isLoading && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                        <div className="text-white">Creating project...</div>
                    </div>
                )}
                {showChatSelector && (
                    <ChatSidebar
                        chats={chats}
                        currentChat={currentChatId?.toString() || ""}
                        onSelectChat={handleSelectProject}
                        onClose={() => setShowChatSelector(false)}
                        onNewProject={handleNewProject}
                    />
                )}
                <ProjectSelectionScreen />
            </>
        );
    }

    return (
        <div key={renderKey} className="h-screen bg-black text-white flex">
            {/* New File Dialog */}
            {showNewFileDialog && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">
                            Create New File
                        </h3>
                        <Input
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="Enter file name (e.g., component.jsx)"
                            className="mb-4"
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    handleCreateFile();
                                }
                            }}
                        />
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowNewFileDialog(false);
                                    setNewItemName("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateFile}
                                disabled={!newItemName.trim()}
                            >
                                Create
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Folder Dialog */}
            {showNewFolderDialog && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">
                            Create New Folder
                        </h3>
                        <Input
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="Enter folder name"
                            className="mb-4"
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    handleCreateFolder();
                                }
                            }}
                        />
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowNewFolderDialog(false);
                                    setNewItemName("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateFolder}
                                disabled={!newItemName.trim()}
                            >
                                Create
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Selector Popup */}
            {showChatSelector && (
                <ChatSidebar
                    chats={chats}
                    currentChat={currentChatId?.toString() || ""}
                    onSelectChat={handleSelectProject}
                    onClose={() => setShowChatSelector(false)}
                    onNewProject={handleNewProject}
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
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setShowProjectEditor(false);
                                setCurrentChatId(null);
                            }}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center space-x-2">
                            <Zap className="w-6 h-6 text-purple-glow" />
                            <h1 className="text-xl font-semibold">
                                {chats.find(
                                    (c) => c.id === currentChatId?.toString()
                                )?.name || "Z9 AI Assistant"}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleNewProject}
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
                    {isLoading || isInitializing ? (
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
                                disabled={!currentChatId || isInitializing}
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={
                                    !inputMessage.trim() ||
                                    !currentChatId ||
                                    isInitializing
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
