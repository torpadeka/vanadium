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
    Code,
    Eye,
    Palette,
    MessageSquare,
    User,
    LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CodeEditor from "@/components/ui/CodeEditor";
import PreviewPane from "@/components/PreviewPane";
import CanvasPane from "@/components/CanvasPane";
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
import { Link } from "react-router";

interface FileNode {
    id: number;
    name: string;
    type: "file" | "folder";
    content?: string;
    children?: FileNode[];
    parentId?: number;
    isOpen?: boolean;
}

type TabType = "code" | "preview" | "canvas";

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
    const [activeTab, setActiveTab] = useState<TabType>("code");
    const [canvasScreenshot, setCanvasScreenshot] = useState<string | null>(null);
    
    const chatHandler = useRef(new ChatSystemHandler());
    const webContainerRef = useRef<WebContainer | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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

        setIsLoading(true);

        try {
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

            // Create default Vite React project structure
            const srcFolderResult = await chatHandler.current.createFolder(versionId, "src");
            if ("err" in srcFolderResult) {
                throw new Error(srcFolderResult.err);
            }
            const srcFolderId = Number(srcFolderResult.ok.id);

            // Create public folder
            const publicFolderResult = await chatHandler.current.createFolder(versionId, "public");
            if ("err" in publicFolderResult) {
                throw new Error(publicFolderResult.err);
            }
            const publicFolderId = Number(publicFolderResult.ok.id);

            // Default Vite React files
            const defaultFiles = [
                // Root files
                {
                    name: "package.json",
                    content: JSON.stringify({
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
                    }, null, 2),
                    folderId: undefined
                },
                {
                    name: "vite.config.js",
                    content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})`,
                    folderId: undefined
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
                    folderId: undefined
                },
                // Public files
                {
                    name: "vite.svg",
                    content: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="31.88" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 257"><defs><linearGradient id="IconifyId1813088fe1fbc01fb466" x1="-.828%" x2="57.636%" y1="7.652%" y2="78.411%"><stop offset="0%" stop-color="#41D1FF"></stop><stop offset="100%" stop-color="#BD34FE"></stop></linearGradient><linearGradient id="IconifyId1813088fe1fbc01fb467" x1="43.376%" x2="50.316%" y1="2.242%" y2="89.03%"><stop offset="0%" stop-color="#FFEA83"></stop><stop offset="8.333%" stop-color="#FFDD35"></stop><stop offset="100%" stop-color="#FFA800"></stop></linearGradient></defs><path fill="url(#IconifyId1813088fe1fbc01fb466)" d="M255.153 37.938L134.897 252.976c-2.483 4.44-8.862 4.466-11.382.048L.875 37.958c-2.746-4.814 1.371-10.646 6.827-9.67l120.385 21.517a6.537 6.537 0 0 0 2.322-.004l117.867-21.483c5.438-.991 9.574 4.796 6.877 9.62Z"></path><path fill="url(#IconifyId1813088fe1fbc01fb467)" d="M185.432.063L96.44 17.501a3.268 3.268 0 0 0-2.634 3.014l-5.474 92.456a3.268 3.268 0 0 0 3.997 3.378l24.777-5.718c2.318-.535 4.413 1.507 3.936 3.838l-7.361 36.047c-.495 2.426 1.782 4.5 4.151 3.78l15.304-4.649c2.372-.72 4.652 1.36 4.15 3.788l-11.698 56.621c-.732 3.542 3.979 5.473 5.943 2.437l1.313-2.028l72.516-144.72c1.215-2.423-.88-5.186-3.54-4.672l-25.505 4.922c-2.396.462-4.435-1.77-3.759-4.114l16.646-57.705c.677-2.35-1.37-4.583-3.769-4.113Z"></path></svg>`,
                    folderId: publicFolderId
                },
                {
                    name: "react.svg",
                    content: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="35.93" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 228"><path fill="#00D8FF" d="M210.483 73.824a171.49 171.49 0 0 0-8.24-2.597c.465-1.9.893-3.777 1.273-5.621c6.238-30.281 2.16-54.676-11.769-62.708c-13.355-7.7-35.196.329-57.254 19.526a171.23 171.23 0 0 0-6.375 5.848a155.866 155.866 0 0 0-4.241-3.917C100.759 3.829 77.587-4.822 63.673 3.233C50.33 10.957 46.379 33.89 51.995 62.588a170.974 170.974 0 0 0 1.892 8.48c-3.28.932-6.445 1.924-9.474 2.98C17.309 83.498 0 98.307 0 113.668c0 15.865 18.582 31.778 46.812 41.427a145.52 145.52 0 0 0 6.921 2.165a167.467 167.467 0 0 0-2.01 9.138c-5.354 28.2-1.173 50.591 12.134 58.266c13.744 7.926 36.812-.22 59.273-19.855a145.567 145.567 0 0 0 5.342-4.923a168.064 168.064 0 0 0 6.92 6.314c21.758 18.722 43.246 26.282 56.54 18.586c13.731-7.949 18.194-32.003 12.4-61.268a145.016 145.016 0 0 0-1.535-6.842c1.62-.48 3.21-.974 4.76-1.488c29.348-9.723 48.443-25.443 48.443-41.52c0-15.417-17.868-30.326-45.517-39.844Zm-6.365 70.984c-1.4.463-2.836.91-4.3 1.345c-3.24-10.257-7.612-21.163-12.963-32.432c5.106-11 9.31-21.767 12.459-31.957c2.619.758 5.16 1.557 7.61 2.4c23.69 8.156 38.14 20.213 38.14 29.504c0 9.896-15.606 22.743-40.946 31.14Zm-10.514 20.834c2.562 12.94 2.927 24.64 1.23 33.787c-1.524 8.219-4.59 13.698-8.382 15.893c-8.067 4.67-25.32-1.4-43.927-17.412a156.726 156.726 0 0 1-6.437-5.87c7.214-7.889 14.423-17.06 21.459-27.246c12.376-1.098 24.068-2.894 34.671-5.345a134.17 134.17 0 0 1 1.386 6.193ZM87.276 214.515c-7.882 2.783-14.16 2.863-17.955.675c-8.075-4.657-11.432-22.636-6.853-46.752a156.923 156.923 0 0 1 1.869-8.499c10.486 2.32 22.093 3.988 34.498 4.994c7.084 9.967 14.501 19.128 21.976 27.15a134.668 134.668 0 0 1-4.877 4.492c-9.933 8.682-19.886 14.842-28.658 17.94ZM50.35 144.747c-12.483-4.267-22.792-9.812-29.858-15.863c-6.35-5.437-9.555-10.836-9.555-15.216c0-9.322 13.897-21.212 37.076-29.293c2.813-.98 5.757-1.905 8.812-2.773c3.204 10.42 7.406 21.315 12.477 32.332c-5.137 11.18-9.399 22.249-12.634 32.792a134.718 134.718 0 0 1-6.318-1.979Zm12.378-84.26c-4.811-24.587-1.616-43.134 6.425-47.789c8.564-4.958 27.502 2.111 47.463 19.835a144.318 144.318 0 0 1 3.841 3.545c-7.438 7.987-14.787 17.08-21.808 26.988c-12.04 1.116-23.565 2.908-34.161 5.309a160.342 160.342 0 0 1-1.76-7.887Zm110.427 27.268a347.8 347.8 0 0 0-7.785-12.803c8.168 1.033 15.994 2.404 23.343 4.08c-2.206 7.072-4.956 14.465-8.193 22.045a381.151 381.151 0 0 0-7.365-13.322Zm-45.032-43.861c5.044 5.465 10.096 11.566 15.065 18.186a322.04 322.04 0 0 0-30.257-.006c4.974-6.559 10.069-12.652 15.192-18.18ZM82.802 87.83a323.167 323.167 0 0 0-7.227 13.238c-3.184-7.553-5.909-14.98-8.134-22.152c7.304-1.634 15.093-2.97 23.209-3.984a321.524 321.524 0 0 0-7.848 12.897Zm8.081 65.352c-8.385-.936-16.291-2.203-23.593-3.793c2.26-7.3 5.045-14.885 8.298-22.6a321.187 321.187 0 0 0 7.257 13.246c2.594 4.48 5.28 8.868 8.038 13.147Zm37.542 31.03c-5.184-5.592-10.354-11.779-15.403-18.433c4.902.192 9.899.29 14.978.29c5.218 0 10.376-.117 15.453-.343c-4.985 6.774-10.018 12.97-15.028 18.486Zm52.198-57.817c3.422 7.8 6.306 15.345 8.596 22.52c-7.422 1.694-15.436 3.058-23.88 4.071a382.417 382.417 0 0 0 7.859-13.026a347.403 347.403 0 0 0 7.425-13.565Zm-16.898 8.101a358.557 358.557 0 0 1-12.281 19.815a329.4 329.4 0 0 1-23.444.823c-7.967 0-15.716-.248-23.178-.732a310.202 310.202 0 0 1-12.513-19.846h.001a307.41 307.41 0 0 1-10.923-20.627a310.278 310.278 0 0 1 10.89-20.637l-.001.001a307.318 307.318 0 0 1 12.413-19.761c7.613-.576 15.42-.876 23.31-.876H128c7.926 0 15.743.303 23.354.883a329.357 329.357 0 0 1 12.335 19.695a358.489 358.489 0 0 1 11.036 20.54a329.472 329.472 0 0 1-11 20.722Zm22.56-122.124c8.572 4.944 11.906 24.881 6.52 51.026c-.344 1.668-.73 3.367-1.15 5.09c-10.622-2.452-22.155-4.275-34.23-5.408c-7.034-10.017-14.323-19.124-21.64-27.008a160.789 160.789 0 0 1 5.888-5.4c18.9-16.447 36.564-22.941 44.612-18.3ZM128 90.808c12.625 0 22.86 10.235 22.86 22.86s-10.235 22.86-22.86 22.86s-22.86-10.235-22.86-22.86s10.235-22.86 22.86-22.86Z"></path></svg>`,
                    folderId: srcFolderId
                },
                // Src files
                {
                    name: "main.jsx",
                    content: `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)`,
                    folderId: srcFolderId
                },
                {
                    name: "App.jsx",
                    content: `import { useState } from 'react'
import reactLogo from './react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
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
    </>
  )
}

export default App`,
                    folderId: srcFolderId
                },
                {
                    name: "App.css",
                    content: `#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.react:hover {
  filter: drop-shadow(0 0 2em #61dafbaa);
}

@keyframes logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: no-preference) {
  a:nth-of-type(2) .logo {
    animation: logo-spin infinite 20s linear;
  }
}

.card {
  padding: 2em;
}

.read-the-docs {
  color: #888;
}`,
                    folderId: srcFolderId
                },
                {
                    name: "index.css",
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
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}
a:hover {
  color: #535bf2;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  color: inherit;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:hover {
  border-color: #646cff;
}
button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
  a:hover {
    color: #747bff;
  }
  button {
    background-color: #f9f9f9;
  }
}`,
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
                } else {
                    console.log(`Successfully created file: ${file.name}`);
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
            setActiveTab("code"); // Switch to code tab when file is selected
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

    const captureCanvasScreenshot = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const screenshot = canvas.toDataURL('image/png');
            setCanvasScreenshot(screenshot);
            return screenshot;
        }
        return null;
    };

    const sendMessage = async () => {
        if (!input.trim() || !currentChat) return;

        try {
            setIsLoading(true);
            const chatId = parseInt(currentChat);
            
            // Capture canvas screenshot if on canvas tab
            let screenshot = null;
            if (activeTab === "canvas") {
                screenshot = captureCanvasScreenshot();
            }
            
            // Create user message (screenshot handling will be implemented later)
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

    const formatTimestamp = (timestamp: bigint) => {
        return new Date(Number(timestamp) / 1000000).toLocaleString();
    };

    // Chat Selection Screen
    if (!principal) {
        return (
            <div className="h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center max-w-md">
                    <User className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                    <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
                    <p className="text-gray-400 mb-6">
                        Please log in to access your projects and start building with vanadium.
                    </p>
                    <Button asChild size="lg">
                        <Link to="/login">
                            <LogIn className="w-4 h-4 mr-2" />
                            Go to Login
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (!currentChat) {
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
            <div className="flex-1 flex flex-col host-grotesk-300">
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
                  <h1 className="text-xl font-semibold">vanadium.</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-400">
                    Welcome, {user?.username}
                  </span>
                  <Button onClick={createNewProject} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    New Project
                  </Button>
                </div>
              </header>

              {/* Chat Selection Content */}
              <div className="flex-1 flex items-center justify-center host-grotesk-300">
                <div className="text-center max-w-2xl px-6">
                  <MessageSquare className="w-20 h-20 mx-auto mb-8 text-gray-600" />
                  <h2 className="text-3xl font-bold mb-4">
                    Welcome to vanadium
                  </h2>
                  <p className="text-xl text-gray-400 mb-8">
                    Create stunning React applications with the power of AI.
                    Start a new project or select an existing one from the
                    sidebar.
                  </p>

                  {chats.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-gray-500">
                        You have {chats.length} project
                        {chats.length !== 1 ? "s" : ""}
                      </p>
                      <div className="flex justify-center space-x-4">
                        <Button
                          variant="outline"
                          onClick={() => setSidebarOpen(true)}
                          className="text-gray-900"
                        >
                          <Menu className="w-4 h-4 mr-2" />
                          Browse Projects
                        </Button>
                        <Button onClick={createNewProject} disabled={isLoading}>
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          New Project
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-gray-500">
                        No projects yet. Create your first project to get
                        started.
                      </p>
                      <Button
                        size="lg"
                        onClick={createNewProject}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <Plus className="w-5 h-5 mr-2" />
                        )}
                        Create Your First Project
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
    }

    return (
      <div className="h-screen bg-black text-white flex host-grotesk-300">
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

        {/* Chat Panel - Left Side */}
        <div className="w-80 border-r border-gray-800 bg-gray-950 flex flex-col ">
          {/* Chat Header */}
          <div className="border-b border-gray-800 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h3 className="text-sm font-medium text-gray-300">Chat</h3>
            </div>
            <Button onClick={createNewProject} disabled={isLoading} size="sm">
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-1" />
              )}
              New
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Start a conversation below</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id.toString()} className="space-y-2">
                  <div
                    className={`flex ${
                      "user" in message.sender ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 text-sm ${
                        "user" in message.sender
                          ? "bg-purple-glow text-white"
                          : "bg-gray-800 text-gray-100"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                      <div className="text-xs opacity-70 mt-1">
                        {formatTimestamp(message.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-800 p-4">
            <div className="flex space-x-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  activeTab === "canvas"
                    ? "Describe what you want to build (canvas will be included)..."
                    : "Describe what you want to build..."
                }
                className="flex-1 min-h-[60px] resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            {activeTab === "canvas" && (
              <p className="text-xs text-gray-500 mt-2">
                💡 Your canvas drawing will be included with your prompt
              </p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-gray-800 p-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Project {currentChat}</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                Welcome, {user?.username}
              </span>
            </div>
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
            <div className="flex-1 flex flex-col">
              {/* Tab Navigation */}
              <div className="border-b border-gray-800 bg-gray-900">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("code")}
                    className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "code"
                        ? "border-purple-glow text-white bg-gray-800"
                        : "border-transparent text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    <Code className="w-4 h-4 mr-2" />
                    Code
                  </button>
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "preview"
                        ? "border-purple-glow text-white bg-gray-800"
                        : "border-transparent text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </button>
                  <button
                    onClick={() => setActiveTab("canvas")}
                    className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "canvas"
                        ? "border-purple-glow text-white bg-gray-800"
                        : "border-transparent text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    <Palette className="w-4 h-4 mr-2" />
                    Canvas
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 flex">
                {activeTab === "code" && (
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
                )}

                {activeTab === "preview" && (
                  <div className="flex-1">
                    {previewUrl ? (
                      <iframe
                        src={previewUrl}
                        className="w-full h-full border-0"
                        title="Preview"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        {isWebContainerReady
                          ? "Starting preview..."
                          : "Loading WebContainer..."}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "canvas" && (
                  <div className="flex-1 flex">
                    {/* Canvas */}
                    <div className="flex-1 relative">
                      <CanvasPane />
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 pointer-events-none opacity-0"
                        width={800}
                        height={600}
                      />
                    </div>

                    {/* Preview (unclickable) */}
                    <div className="w-1/2 border-l border-gray-800 relative">
                      <div className="border-b border-gray-800 p-2 bg-gray-900">
                        <span className="text-sm text-gray-300">
                          Preview (Read-only)
                        </span>
                      </div>
                      <div className="h-full relative">
                        {previewUrl ? (
                          <>
                            <iframe
                              src={previewUrl}
                              className="w-full h-full border-0"
                              title="Preview"
                            />
                            {/* Overlay to make preview unclickable */}
                            <div className="absolute inset-0 bg-transparent cursor-not-allowed" />
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            {isWebContainerReady
                              ? "Starting preview..."
                              : "Loading WebContainer..."}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

export default Z9Page;