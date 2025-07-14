import React, { useState, useEffect, useRef } from "react";
import { WebContainer } from "@webcontainer/api";
import {
    Menu,
    Send,
    Plus,
    FolderOpen,
    File,
    ChevronRight,
    ChevronDown,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CodeEditor from "@/components/ui/CodeEditor";
import PreviewPane from "@/components/PreviewPane";
import ChatSidebar from "@/components/ChatSidebar";
import { useUser } from "@/context/AuthContext";
import { ChatSystemHandler } from "@/handler/ChatSystemHandler";
import {
    Chat,
    File as FileType,
    Folder,
    Message,
    ProjectVersion,
} from "@/declarations/chat_system_service/chat_system_service.did";

interface FileNode {
    id: number;
    name: string;
    type: "file" | "folder";
    content?: string;
    children?: FileNode[];
    parentId?: number;
    isOpen?: boolean;
}

const Z9Page: React.FC = () => {
    const { user, principal } = useUser();
    const [webContainer, setWebContainer] = useState<WebContainer | null>(null);
    const [isWebContainerReady, setIsWebContainerReady] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentChat, setCurrentChat] = useState<string>("");
    const [chats, setChats] = useState<any[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [currentProjectVersion, setCurrentProjectVersion] = useState<ProjectVersion | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    
    const chatHandler = useRef(new ChatSystemHandler());
    const webContainerRef = useRef<WebContainer | null>(null);

    // Initialize WebContainer
    useEffect(() => {
        const initWebContainer = async () => {
            try {
                console.log("Initializing WebContainer...");
                const container = await WebContainer.boot();
                webContainerRef.current = container;
                setWebContainer(container);
                setIsWebContainerReady(true);
                console.log("WebContainer initialized successfully");
            } catch (error) {
                console.error("Failed to initialize WebContainer:", error);
            }
        };

        initWebContainer();

        return () => {
            if (webContainerRef.current) {
                webContainerRef.current.teardown();
            }
        };
    }, []);

    // Load chats on component mount
    useEffect(() => {
        if (principal) {
            loadChats();
        }
    }, [principal]);

    // Load messages when current chat changes
    useEffect(() => {
        if (currentChat) {
            loadMessages(parseInt(currentChat));
            loadProjectFiles(parseInt(currentChat));
        }
    }, [currentChat]);

    const loadChats = async () => {
        if (!principal) return;
        
        try {
            const result = await chatHandler.current.getAllChatByUserId(principal);
            if ("ok" in result) {
                const formattedChats = result.ok.map((chat: Chat) => ({
                    id: chat.id.toString(),
                    name: chat.title?.[0] || `Project ${chat.id}`,
                    timestamp: new Date(Number(chat.createdAt) / 1000000),
                }));
                setChats(formattedChats);
            }
        } catch (error) {
            console.error("Failed to load chats:", error);
        }
    };

    const loadMessages = async (chatId: number) => {
        try {
            const result = await chatHandler.current.getAllMessageByChatId(chatId);
            if ("ok" in result) {
                setMessages(result.ok);
            }
        } catch (error) {
            console.error("Failed to load messages:", error);
        }
    };

    const loadProjectFiles = async (chatId: number) => {
        try {
            // Get project versions for this chat
            const versionsResult = await chatHandler.current.getAllProjectVersionByChatId(chatId);
            if ("ok" in versionsResult && versionsResult.ok.length > 0) {
                const latestVersion = versionsResult.ok[versionsResult.ok.length - 1];
                setCurrentProjectVersion(latestVersion);

                // Get files and folders for the latest version
                const [filesResult, foldersResult] = await Promise.all([
                    chatHandler.current.getAllFileByProjectVersionId(Number(latestVersion.id)),
                    chatHandler.current.getAllFolderByProjectVersionId(Number(latestVersion.id))
                ]);

                if ("ok" in filesResult && "ok" in foldersResult) {
                    const files = filesResult.ok;
                    const folders = foldersResult.ok;
                    
                    // Build file tree
                    const tree = buildFileTree(files, folders);
                    setFileTree(tree);
                    
                    // Mount files to WebContainer
                    await mountFilesToWebContainer(files, folders);
                }
            }
        } catch (error) {
            console.error("Failed to load project files:", error);
        }
    };

    const buildFileTree = (files: FileType[], folders: Folder[]): FileNode[] => {
        const nodeMap = new Map<number, FileNode>();
        const rootNodes: FileNode[] = [];

        // Create folder nodes
        folders.forEach(folder => {
            const node: FileNode = {
                id: Number(folder.id),
                name: folder.name,
                type: "folder",
                children: [],
                parentId: folder.parentId?.[0] ? Number(folder.parentId[0]) : undefined,
                isOpen: false
            };
            nodeMap.set(Number(folder.id), node);
        });

        // Create file nodes
        files.forEach(file => {
            const node: FileNode = {
                id: Number(file.id),
                name: file.name,
                type: "file",
                content: file.content,
                parentId: file.folderId?.[0] ? Number(file.folderId[0]) : undefined
            };
            nodeMap.set(Number(file.id), node);
        });

        // Build tree structure
        nodeMap.forEach(node => {
            if (node.parentId && nodeMap.has(node.parentId)) {
                const parent = nodeMap.get(node.parentId)!;
                if (parent.children) {
                    parent.children.push(node);
                }
            } else {
                rootNodes.push(node);
            }
        });

        // Sort nodes (folders first, then files, both alphabetically)
        const sortNodes = (nodes: FileNode[]) => {
            nodes.sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type === "folder" ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });
            nodes.forEach(node => {
                if (node.children) {
                    sortNodes(node.children);
                }
            });
        };

        sortNodes(rootNodes);
        return rootNodes;
    };

    const mountFilesToWebContainer = async (files: FileType[], folders: Folder[]) => {
        if (!webContainer) return;

        try {
            console.log("Mounting files to WebContainer...");
            
            // Create package.json first
            const packageJson = {
                name: "vanadium-project",
                private: true,
                version: "0.0.0",
                type: "module",
                scripts: {
                    dev: "vite",
                    build: "vite build",
                    preview: "vite preview"
                },
                dependencies: {
                    react: "^18.2.0",
                    "react-dom": "^18.2.0"
                },
                devDependencies: {
                    "@types/react": "^18.2.15",
                    "@types/react-dom": "^18.2.7",
                    "@vitejs/plugin-react": "^4.0.3",
                    vite: "^4.4.5"
                }
            };

            await webContainer.fs.writeFile("package.json", JSON.stringify(packageJson, null, 2));

            // Create vite.config.js
            const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;
            await webContainer.fs.writeFile("vite.config.js", viteConfig);

            // Create index.html
            const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vanadium Project</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
            await webContainer.fs.writeFile("index.html", indexHtml);

            // Create folders first
            for (const folder of folders) {
                const folderPath = getFolderPath(folder, folders);
                await webContainer.fs.mkdir(folderPath, { recursive: true });
                console.log(`Created folder: ${folderPath}`);
            }

            // Create files
            for (const file of files) {
                const filePath = getFilePath(file, folders);
                await webContainer.fs.writeFile(filePath, file.content);
                console.log(`Created file: ${filePath}`);
            }

            // Install dependencies and start dev server
            await installAndStartDev();

        } catch (error) {
            console.error("Failed to mount files to WebContainer:", error);
        }
    };

    const getFolderPath = (folder: Folder, allFolders: Folder[]): string => {
        if (!folder.parentId?.[0]) {
            return folder.name;
        }
        
        const parent = allFolders.find(f => Number(f.id) === Number(folder.parentId![0]));
        if (parent) {
            return `${getFolderPath(parent, allFolders)}/${folder.name}`;
        }
        
        return folder.name;
    };

    const getFilePath = (file: FileType, folders: Folder[]): string => {
        if (!file.folderId?.[0]) {
            return file.name;
        }
        
        const folder = folders.find(f => Number(f.id) === Number(file.folderId![0]));
        if (folder) {
            const folderPath = getFolderPath(folder, folders);
            return `${folderPath}/${file.name}`;
        }
        
        return file.name;
    };

    const installAndStartDev = async () => {
        if (!webContainer) return;

        try {
            console.log("Installing dependencies...");
            const installProcess = await webContainer.spawn("npm", ["install"]);
            
            installProcess.output.pipeTo(
                new WritableStream({
                    write(data) {
                        console.log("Install output:", data);
                    },
                })
            );

            const installExitCode = await installProcess.exit;
            if (installExitCode !== 0) {
                console.error("Failed to install dependencies");
                return;
            }

            console.log("Starting dev server...");
            const devProcess = await webContainer.spawn("npm", ["run", "dev"]);
            
            devProcess.output.pipeTo(
                new WritableStream({
                    write(data) {
                        const output = data.toString();
                        console.log("Dev server output:", output);
                        
                        // Look for the local server URL
                        const localMatch = output.match(/Local:\s+http:\/\/localhost:(\d+)/);
                        if (localMatch) {
                            const port = localMatch[1];
                            console.log(`Dev server running on port ${port}`);
                            setPreviewUrl(`http://localhost:${port}`);
                        }
                    },
                })
            );

            // Listen for server ready event
            webContainer.on("server-ready", (port, url) => {
                console.log(`Server ready on port ${port}: ${url}`);
                setPreviewUrl(url);
            });

        } catch (error) {
            console.error("Failed to install dependencies or start dev server:", error);
        }
    };

    const createNewProject = async () => {
        if (!principal) return;

        try {
            setIsLoading(true);
            
            // Create new chat
            const chatResult = await chatHandler.current.createChat("New Project");
            if ("err" in chatResult) {
                throw new Error(chatResult.err);
            }

            const newChat = chatResult.ok;
            const chatId = Number(newChat.id);

            // Create project version
            const versionResult = await chatHandler.current.createProjectVersion(
                chatId,
                1,
                "Initial project setup"
            );
            if ("err" in versionResult) {
                throw new Error(versionResult.err);
            }

            const version = versionResult.ok;
            const versionId = Number(version.id);

            // Create default folder structure
            const srcFolderResult = await chatHandler.current.createFolder(versionId, "src");
            if ("err" in srcFolderResult) {
                throw new Error(srcFolderResult.err);
            }
            const srcFolderId = Number(srcFolderResult.ok.id);

            // Create default files
            const defaultFiles = [
                {
                    name: "App.jsx",
                    content: `import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Welcome to Vanadium!</h1>
      <p>Start building your React application here.</p>
    </div>
  );
}

export default App;`,
                    folderId: srcFolderId
                },
                {
                    name: "main.jsx",
                    content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);`,
                    folderId: srcFolderId
                }
            ];

            // Create files in backend
            for (const file of defaultFiles) {
                const fileResult = await chatHandler.current.createFile(
                    versionId,
                    file.folderId,
                    file.name,
                    file.content
                );
                if ("err" in fileResult) {
                    console.error(`Failed to create file ${file.name}:`, fileResult.err);
                }
            }

            // Update chats list and select new chat
            await loadChats();
            setCurrentChat(chatId.toString());
            
        } catch (error) {
            console.error("Failed to create new project:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFolder = (nodeId: number) => {
        const updateTree = (nodes: FileNode[]): FileNode[] => {
            return nodes.map(node => {
                if (node.id === nodeId && node.type === "folder") {
                    return { ...node, isOpen: !node.isOpen };
                }
                if (node.children) {
                    return { ...node, children: updateTree(node.children) };
                }
                return node;
            });
        };
        
        setFileTree(updateTree(fileTree));
    };

    const selectFile = (node: FileNode) => {
        if (node.type === "file") {
            setSelectedFile(node);
        }
    };

    const updateFileContent = async (content: string) => {
        if (!selectedFile || !currentProjectVersion) return;

        try {
            // Update in backend
            const result = await chatHandler.current.updateFile(
                selectedFile.id,
                undefined,
                undefined,
                content
            );
            
            if ("ok" in result) {
                // Update local state
                setSelectedFile({ ...selectedFile, content });
                
                // Update file tree
                const updateTree = (nodes: FileNode[]): FileNode[] => {
                    return nodes.map(node => {
                        if (node.id === selectedFile.id) {
                            return { ...node, content };
                        }
                        if (node.children) {
                            return { ...node, children: updateTree(node.children) };
                        }
                        return node;
                    });
                };
                setFileTree(updateTree(fileTree));

                // Update in WebContainer
                if (webContainer) {
                    const filePath = getFilePathFromTree(selectedFile.id, fileTree);
                    if (filePath) {
                        await webContainer.fs.writeFile(filePath, content);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to update file:", error);
        }
    };

    const getFilePathFromTree = (fileId: number, nodes: FileNode[], currentPath = ""): string | null => {
        for (const node of nodes) {
            const nodePath = currentPath ? `${currentPath}/${node.name}` : node.name;
            
            if (node.id === fileId) {
                return nodePath;
            }
            
            if (node.children) {
                const result = getFilePathFromTree(fileId, node.children, nodePath);
                if (result) return result;
            }
        }
        return null;
    };

    const renderFileTree = (nodes: FileNode[], depth = 0) => {
        return nodes.map(node => (
            <div key={node.id}>
                <div
                    className={`flex items-center py-1 px-2 hover:bg-gray-800 cursor-pointer ${
                        selectedFile?.id === node.id ? "bg-gray-700" : ""
                    }`}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                    onClick={() => {
                        if (node.type === "folder") {
                            toggleFolder(node.id);
                        } else {
                            selectFile(node);
                        }
                    }}
                >
                    {node.type === "folder" && (
                        <span className="mr-1">
                            {node.isOpen ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </span>
                    )}
                    {node.type === "folder" ? (
                        <FolderOpen className="w-4 h-4 mr-2 text-blue-400" />
                    ) : (
                        <File className="w-4 h-4 mr-2 text-gray-400" />
                    )}
                    <span className="text-sm">{node.name}</span>
                </div>
                {node.type === "folder" && node.isOpen && node.children && (
                    <div>
                        {renderFileTree(node.children, depth + 1)}
                    </div>
                )}
            </div>
        ));
    };

    const sendMessage = async () => {
        if (!input.trim() || !currentChat) return;

        try {
            setIsLoading(true);
            const chatId = parseInt(currentChat);
            
            // Create user message
            await chatHandler.current.createMessage(
                chatId,
                { user: null },
                input,
                currentProjectVersion ? Number(currentProjectVersion.id) : undefined
            );

            // Reload messages
            await loadMessages(chatId);
            setInput("");
            
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen bg-black text-white flex">
            {/* Chat Sidebar */}
            {sidebarOpen && (
                <ChatSidebar
                    chats={chats}
                    currentChat={currentChat}
                    onSelectChat={setCurrentChat}
                    onClose={() => setSidebarOpen(false)}
                    onNewProject={createNewProject}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="border-b border-gray-800 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                        <h1 className="text-xl font-semibold">
                            {currentChat ? `Project ${currentChat}` : "vanadium"}
                        </h1>
                    </div>
                    <Button onClick={createNewProject} disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Plus className="w-4 h-4 mr-2" />
                        )}
                        New Project
                    </Button>
                </header>

                {/* Main Layout */}
                <div className="flex-1 flex">
                    {/* File Explorer */}
                    <div className="w-64 border-r border-gray-800 bg-gray-950">
                        <div className="p-3 border-b border-gray-800">
                            <h3 className="text-sm font-medium text-gray-300">Explorer</h3>
                        </div>
                        <div className="overflow-y-auto">
                            {fileTree.length > 0 ? (
                                renderFileTree(fileTree)
                            ) : (
                                <div className="p-4 text-sm text-gray-500 text-center">
                                    No files yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Editor and Preview */}
                    <div className="flex-1 flex">
                        {/* Code Editor */}
                        <div className="flex-1 flex flex-col">
                            {selectedFile ? (
                                <>
                                    <div className="border-b border-gray-800 p-2 bg-gray-900">
                                        <span className="text-sm text-gray-300">
                                            {selectedFile.name}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <CodeEditor
                                            code={selectedFile.content || ""}
                                            onChange={updateFileContent}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-500">
                                    Select a file to edit
                                </div>
                            )}
                        </div>

                        {/* Preview */}
                        <div className="w-1/2 border-l border-gray-800">
                            <div className="border-b border-gray-800 p-2 bg-gray-900">
                                <span className="text-sm text-gray-300">Preview</span>
                            </div>
                            <div className="h-full">
                                {previewUrl ? (
                                    <iframe
                                        src={previewUrl}
                                        className="w-full h-full border-0"
                                        title="Preview"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        {isWebContainerReady ? "Starting preview..." : "Loading WebContainer..."}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Input */}
                <div className="border-t border-gray-800 p-4">
                    <div className="flex space-x-2">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Describe what you want to build..."
                            className="flex-1 min-h-[60px] resize-none"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                        />
                        <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Z9Page;