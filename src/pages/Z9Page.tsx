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
import CanvasPane from "@/components/CanvasPane";
import ChatSidebar from "@/components/ChatSidebar";
import { useUser } from "@/context/AuthContext";
import { ChatSystemHandler } from "@/handler/ChatSystemHandler";
import { AIResponse, AIService } from "@/services/aiService";
import {
    Chat,
    File as FileType,
    Folder,
    Message,
    ProjectVersion,
} from "@/declarations/chat_system_service/chat_system_service.did";
import { Link } from "react-router";

export interface FileNode {
    id: number;
    name: string;
    type: "file" | "folder";
    content?: string;
    children?: FileNode[];
    parentId?: number;
    isOpen?: boolean;
    path?: string;
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
    const [currentProjectVersion, setCurrentProjectVersion] =
        useState<ProjectVersion | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [activeTab, setActiveTab] = useState<TabType>("code");
    const [canvasScreenshot, setCanvasScreenshot] = useState<string | null>(
        null
    );
    const [includeCanvas, setIncludeCanvas] = useState(false);
    const [aiService] = useState(() => new AIService());

    const chatHandler = useRef(new ChatSystemHandler());
    const webContainerRef = useRef<WebContainer | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [suggestedActions, setSuggestedActions] = useState<
        { name: string; description: string }[]
    >([]);

    const [fileTreeReady, setFileTreeReady] = useState(false);

    const [thinking, setThinking] = useState<boolean>(false);

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
            if (webContainerRef.current && !document.hidden) {
                webContainerRef.current.teardown();
                webContainerRef.current = null;
                setWebContainer(null);
            }
        };
    }, []);

    useEffect(() => {
        if (principal) {
            loadChats();
        }
    }, [principal]);

    useEffect(() => {
        if (currentChat) {
            loadMessages(parseInt(currentChat));
            loadProjectFiles(parseInt(currentChat)).then(() => {
                // Ensure fileTree is ready before allowing sendMessage to proceed
                setFileTreeReady(true);
            });
        }
    }, [currentChat]);

    const loadChats = async () => {
        if (!principal) return;

        try {
            const result =
                await chatHandler.current.getAllChatByUserId(principal);
            if ("ok" in result) {
                const formattedChats = result.ok.map((chat: Chat) => ({
                    id: chat.id.toString(),
                    name: chat.title?.[0] || `Project ${chat.id}`,
                    timestamp: new Date(Number(chat.createdAt) / 1000000),
                }));
                // Sort chats by timestamp in descending order (newest first)
                formattedChats.sort(
                    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
                );
                setChats(formattedChats);
            }
        } catch (error) {
            console.error("Failed to load chats:", error);
        }
    };

    const loadMessages = async (chatId: number) => {
        try {
            const result =
                await chatHandler.current.getAllMessageByChatId(chatId);
            if ("ok" in result) {
                // Sort messages by createdAt in ascending order (oldest first)
                const sortedMessages = result.ok.sort(
                    (a, b) => Number(a.createdAt) - Number(b.createdAt)
                );
                setMessages(sortedMessages);
            }
        } catch (error) {
            console.error("Failed to load messages:", error);
        }
    };

    const loadProjectFiles = async (chatId: number) => {
        try {
            const versionsResult =
                await chatHandler.current.getAllProjectVersionByChatId(chatId);
            if ("ok" in versionsResult && versionsResult.ok.length > 0) {
                const latestVersion =
                    versionsResult.ok[versionsResult.ok.length - 1];
                setCurrentProjectVersion(latestVersion);

                const [filesResult, foldersResult] = await Promise.all([
                    chatHandler.current.getAllFileByProjectVersionId(
                        Number(latestVersion.id)
                    ),
                    chatHandler.current.getAllFolderByProjectVersionId(
                        Number(latestVersion.id)
                    ),
                ]);

                if ("ok" in filesResult && "ok" in foldersResult) {
                    const files = filesResult.ok;
                    const folders = foldersResult.ok;

                    const tree = buildFileTree(files, folders);
                    console.log("Built fileTree for chat", chatId, ":", tree);
                    setFileTree(tree);

                    if (webContainer) {
                        console.log("Mounting files to WebContainer...");
                        await mountFilesToWebContainer(files, folders);
                        console.log(
                            "Rebuilt fileTree after mount:",
                            tree.map((n) => ({
                                id: n.id,
                                name: n.name,
                                path: n.path,
                                parentId: n.parentId,
                                children: n.children
                                    ? n.children.map((c) => ({
                                          id: c.id,
                                          name: c.name,
                                      }))
                                    : undefined,
                            }))
                        ); // Enhanced log with children
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load project files:", error);
        }
    };

    const buildFileTree = (
        files: FileType[],
        folders: Folder[]
    ): FileNode[] => {
        const nodeMap = new Map<number, FileNode>();
        const rootNodes: FileNode[] = [];

        // Create folder nodes
        folders.forEach((folder) => {
            const node: FileNode = {
                id: Number(folder.id),
                name: folder.name,
                type: "folder",
                children: [],
                parentId: folder.parentId?.[0]
                    ? Number(folder.parentId[0])
                    : undefined,
                isOpen: false,
                path: getFolderPath(folder, folders),
            };
            nodeMap.set(Number(folder.id), node);
        });

        // Create file nodes
        files.forEach((file) => {
            const node: FileNode = {
                id: Number(file.id),
                name: file.name,
                type: "file",
                content: file.content,
                parentId: file.folderId?.[0]
                    ? Number(file.folderId[0])
                    : undefined,
                path: getFilePath(file, folders),
            };
            nodeMap.set(Number(file.id), node);
        });

        // Link nodes to their parents
        nodeMap.forEach((node) => {
            if (node.parentId && nodeMap.has(node.parentId)) {
                const parent = nodeMap.get(node.parentId)!;
                (parent.children = parent.children || []).push(node);
            } else {
                rootNodes.push(node);
            }
        });

        // Sort and filter root nodes
        const sortNodes = (nodes: FileNode[]) => {
            nodes.sort((a, b) =>
                a.type !== b.type
                    ? a.type === "folder"
                        ? -1
                        : 1
                    : a.name.localeCompare(b.name)
            );
            nodes.forEach((node) => node.children && sortNodes(node.children));
        };
        sortNodes(rootNodes);

        const finalRootNodes = rootNodes.filter(
            (node) => node.type === "folder" || !node.parentId
        );
        console.log("Built fileTree with hierarchy:", finalRootNodes); // Debug log with children
        return finalRootNodes;
    };

    const mountFilesToWebContainer = async (
        files: FileType[],
        folders: Folder[]
    ) => {
        if (!webContainer) return;

        try {
            console.log("Mounting files to WebContainer...");

            // Create folder structure
            for (const folder of folders) {
                const folderPath = getFolderPath(folder, folders);
                await webContainer.fs.mkdir(folderPath, { recursive: true });
                console.log(`Created folder: ${folderPath}`);
            }

            // Write files
            for (const file of files) {
                const filePath = getFilePath(file, folders);
                await webContainer.fs.writeFile(filePath, file.content || "");
                console.log(`Created file: ${filePath}`);
            }

            await installAndStartDev();

            // Rebuild fileTree after mounting to reflect structure
            const updatedTree = buildFileTree(files, folders);
            setFileTree(updatedTree);
        } catch (error) {
            console.error("Failed to mount files to WebContainer:", error);
        }
    };

    const getFolderPath = (folder: Folder, allFolders: Folder[]): string => {
        if (!folder.parentId?.[0]) {
            return folder.name;
        }

        const parent = allFolders.find(
            (f) => Number(f.id) === Number(folder.parentId![0])
        );
        if (parent) {
            return `${getFolderPath(parent, allFolders)}/${folder.name}`;
        }

        return folder.name;
    };

    const getFilePath = (file: FileType, folders: Folder[]): string => {
        if (!file.folderId?.[0]) {
            return file.name;
        }

        const folder = folders.find(
            (f) => Number(f.id) === Number(file.folderId![0])
        );
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
            await installProcess.exit;
            console.log("Dependencies installed");

            console.log("Mounting files and starting dev server...");
            const devProcess = await webContainer.spawn("npm", ["run", "dev"]);
            devProcess.output.pipeTo(
                new WritableStream({
                    write(data) {
                        console.log("Dev server output:", data.toString());
                    },
                })
            );

            webContainer.on("server-ready", (port, url) => {
                console.log(`Server ready on port ${port}: ${url}`);
                setPreviewUrl(`${url}/?t=${Date.now()}`);
            });
        } catch (error) {
            console.error("Dev server setup failed:", error);
        }
    };

    const createNewProject = async () => {
        if (!principal) return;

        setIsLoading(true);

        try {
            const chatResult =
                await chatHandler.current.createChat("New Project");
            if ("err" in chatResult) {
                throw new Error(chatResult.err);
            }

            const newChat = chatResult.ok;
            const chatId = Number(newChat.id);

            const versionResult =
                await chatHandler.current.createProjectVersion(
                    chatId,
                    1,
                    "Initial project setup"
                );
            if ("err" in versionResult) {
                throw new Error(versionResult.err);
            }

            const version = versionResult.ok;
            const versionId = Number(version.id);

            const srcFolderResult = await chatHandler.current.createFolder(
                versionId,
                "src"
            );
            if ("err" in srcFolderResult) {
                throw new Error(srcFolderResult.err);
            }
            const srcFolderId = Number(srcFolderResult.ok.id);

            const assetsFolderResult = await chatHandler.current.createFolder(
                versionId,
                "assets",
                srcFolderId
            );
            if ("err" in assetsFolderResult) {
                throw new Error(assetsFolderResult.err);
            }
            const assetsFolderId = Number(assetsFolderResult.ok.id);

            const publicFolderResult = await chatHandler.current.createFolder(
                versionId,
                "public"
            );
            if ("err" in publicFolderResult) {
                throw new Error(publicFolderResult.err);
            }
            const publicFolderId = Number(publicFolderResult.ok.id);

            const componentsFolderResult =
                await chatHandler.current.createFolder(
                    versionId,
                    "components",
                    srcFolderId
                );
            if ("err" in componentsFolderResult) {
                throw new Error(componentsFolderResult.err);
            }
            const componentsFolderId = Number(componentsFolderResult.ok.id);

            const uiFolderResult = await chatHandler.current.createFolder(
                versionId,
                "ui",
                componentsFolderId
            );
            if ("err" in uiFolderResult) {
                throw new Error(uiFolderResult.err);
            }
            const uiFolderId = Number(uiFolderResult.ok.id);

            const libFolderResult = await chatHandler.current.createFolder(
                versionId,
                "lib",
                srcFolderId
            );
            if ("err" in libFolderResult) {
                throw new Error(libFolderResult.err);
            }
            const libFolderId = Number(libFolderResult.ok.id);

            const hooksFolderResult = await chatHandler.current.createFolder(
                versionId,
                "hooks",
                srcFolderId
            );
            if ("err" in hooksFolderResult) {
                throw new Error(hooksFolderResult.err);
            }
            const hooksFolderId = Number(hooksFolderResult.ok.id);

            const defaultFiles = [
                // Root files
                {
                    name: "package.json",
                    content: JSON.stringify(
                        {
                            name: "z9-project-template",
                            private: true,
                            version: "0.0.0",
                            type: "module",
                            scripts: {
                                dev: "vite",
                                build: "tsc -b && vite build",
                                lint: "eslint .",
                                preview: "vite preview",
                            },
                            dependencies: {
                                "@hookform/resolvers": "^5.1.1",
                                "@radix-ui/react-accordion": "^1.2.11",
                                "@radix-ui/react-alert-dialog": "^1.1.14",
                                "@radix-ui/react-aspect-ratio": "^1.1.7",
                                "@radix-ui/react-avatar": "^1.1.10",
                                "@radix-ui/react-checkbox": "^1.3.2",
                                "@radix-ui/react-collapsible": "^1.1.11",
                                "@radix-ui/react-context-menu": "^2.2.15",
                                "@radix-ui/react-dialog": "^1.1.14",
                                "@radix-ui/react-dropdown-menu": "^2.1.15",
                                "@radix-ui/react-hover-card": "^1.1.14",
                                "@radix-ui/react-label": "^2.1.7",
                                "@radix-ui/react-menubar": "^1.1.15",
                                "@radix-ui/react-navigation-menu": "^1.2.13",
                                "@radix-ui/react-popover": "^1.1.14",
                                "@radix-ui/react-progress": "^1.1.7",
                                "@radix-ui/react-radio-group": "^1.3.7",
                                "@radix-ui/react-scroll-area": "^1.2.9",
                                "@radix-ui/react-select": "^2.2.5",
                                "@radix-ui/react-separator": "^1.1.7",
                                "@radix-ui/react-slider": "^1.3.5",
                                "@radix-ui/react-slot": "^1.2.3",
                                "@radix-ui/react-switch": "^1.2.5",
                                "@radix-ui/react-tabs": "^1.1.12",
                                "@radix-ui/react-toggle": "^1.1.9",
                                "@radix-ui/react-toggle-group": "^1.1.10",
                                "@radix-ui/react-tooltip": "^1.2.7",
                                "@tailwindcss/vite": "^4.1.11",
                                "class-variance-authority": "^0.7.1",
                                clsx: "^2.1.1",
                                cmdk: "^1.1.1",
                                "date-fns": "^4.1.0",
                                "embla-carousel-react": "^8.6.0",
                                "input-otp": "^1.4.2",
                                "lucide-react": "^0.525.0",
                                "next-themes": "^0.4.6",
                                react: "^19.1.0",
                                "react-day-picker": "^9.8.0",
                                "react-dom": "^19.1.0",
                                "react-hook-form": "^7.60.0",
                                "react-resizable-panels": "^3.0.3",
                                recharts: "^2.15.4",
                                sonner: "^2.0.6",
                                "tailwind-merge": "^3.3.1",
                                tailwindcss: "^4.1.11",
                                vaul: "^1.1.2",
                                zod: "^4.0.5",
                            },
                            devDependencies: {
                                "@eslint/js": "^9.30.1",
                                "@types/node": "^24.0.15",
                                "@types/react": "^19.1.8",
                                "@types/react-dom": "^19.1.6",
                                "@vitejs/plugin-react": "^4.6.0",
                                eslint: "^9.30.1",
                                "eslint-plugin-react-hooks": "^5.2.0",
                                "eslint-plugin-react-refresh": "^0.4.20",
                                globals: "^16.3.0",
                                "tw-animate-css": "^1.3.5",
                                typescript: "~5.8.3",
                                "typescript-eslint": "^8.35.1",
                                vite: "^7.0.4",
                            },
                        },
                        null,
                        2
                    ),
                    folderId: undefined,
                },
                {
                    name: ".gitignore",
                    content: `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
`,
                    folderId: undefined,
                },
                {
                    name: "components.json",
                    content: `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}`,
                    folderId: undefined,
                },
                {
                    name: "eslint.config.js",
                    content: `import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
`,
                    folderId: undefined,
                },
                {
                    name: "tsconfig.app.json",
                    content: `{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,

    /* shadcn */
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  },
  "include": ["src"]
}
`,
                    folderId: undefined,
                },
                {
                    name: "tsconfig.json",
                    content: `{
  "files": [],
  "references": [
    {
      "path": "./tsconfig.app.json"
    },
    {
      "path": "./tsconfig.node.json"
    }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
`,
                    folderId: undefined,
                },
                {
                    name: "tsconfig.node.json",
                    content: `{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
`,
                    folderId: undefined,
                },
                {
                    name: "vite.config.ts",
                    content: `import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    server: {
      host: true, // Allow external connections
      cors: true, // Enable CORS
      hmr: {
        protocol: 'wss',
        host: 'localhost',
      },
    },
    build: {
      sourcemap: false, // Disable source maps
    },
  },
})`,
                    folderId: undefined,
                },
                {
                    name: "index.html",
                    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
                    folderId: undefined,
                },
                // Public files
                {
                    name: "vite.svg",
                    content: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="31.88" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 257"><defs><linearGradient id="IconifyId1813088fe1fbc01fb466" x1="-.828%" x2="57.636%" y1="7.652%" y2="78.411%"><stop offset="0%" stop-color="#41D1FF"></stop><stop offset="100%" stop-color="#BD34FE"></stop></linearGradient><linearGradient id="IconifyId1813088fe1fbc01fb467" x1="43.376%" x2="50.316%" y1="2.242%" y2="89.03%"><stop offset="0%" stop-color="#FFEA83"></stop><stop offset="8.333%" stop-color="#FFDD35"></stop><stop offset="100%" stop-color="#FFA800"></stop></linearGradient></defs><path fill="url(#IconifyId1813088fe1fbc01fb466)" d="M255.153 37.938L134.897 252.976c-2.483 4.44-8.862 4.466-11.382.048L.875 37.958c-2.746-4.814 1.371-10.646 6.827-9.67l120.385 21.517a6.537 6.537 0 0 0 2.322-.004l117.867-21.483c5.438-.991 9.574 4.796 6.877 9.62Z"></path><path fill="url(#IconifyId1813088fe1fbc01fb467)" d="M185.432.063L96.44 17.501a3.268 3.268 0 0 0-2.634 3.014l-5.474 92.456a3.268 3.268 0 0 0 3.997 3.378l24.777-5.718c2.318-.535 4.413 1.507 3.936 3.838l-7.361 36.047c-.495 2.426 1.782 4.5 4.151 3.78l15.304-4.649c2.372-.72 4.652 1.36 4.15 3.788l-11.698 56.621c-.732 3.542 3.979 5.473 5.943 2.437l1.313-2.028l72.516-144.72c1.215-2.423-.88-5.186-3.54-4.672l-25.505 4.922c-2.396.462-4.435-1.77-3.759-4.114l16.646-57.705c.677-2.35-1.37-4.583-3.769-4.113Z"></path></svg>`,
                    folderId: publicFolderId,
                },
                {
                    name: "react.svg",
                    content: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="35.93" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 228"><path fill="#00D8FF" d="M210.483 73.824a171.49 171.49 0 0 0-8.24-2.597c.465-1.9.893-3.777 1.273-5.621c6.238-30.281 2.16-54.676-11.769-62.708c-13.355-7.7-35.196.329-57.254 19.526a171.23 171.23 0 0 0-6.375 5.848a155.866 155.866 0 0 0-4.241-3.917C100.759 3.829 77.587-4.822 63.673 3.233C50.33 10.957 46.379 33.89 51.995 62.588a170.974 170.974 0 0 0 1.892 8.48c-3.28.932-6.445 1.924-9.474 2.98C17.309 83.498 0 98.307 0 113.668c0 15.865 18.582 31.778 46.812 41.427a145.52 145.52 0 0 0 6.921 2.165a167.467 167.467 0 0 0-2.01 9.138c-5.354 28.2-1.173 50.591 12.134 58.266c13.744 7.926 36.812-.22 59.273-19.855a145.567 145.567 0 0 0 5.342-4.923a168.064 168.064 0 0 0 6.92 6.314c21.758 18.722 43.246 26.282 56.54 18.586c13.731-7.949 18.194-32.003 12.4-61.268a145.016 145.016 0 0 0-1.535-6.842c1.62-.48 3.21-.974 4.76-1.488c29.348-9.723 48.443-25.443 48.443-41.52c0-15.417-17.868-30.326-45.517-39.844Zm-6.365 70.984c-1.4.463-2.836.91-4.3 1.345c-3.24-10.257-7.612-21.163-12.963-32.432c5.106-11 9.31-21.767 12.459-31.957c2.619.758 5.16 1.557 7.61 2.4c23.69 8.156 38.14 20.213 38.14 29.504c0 9.896-15.606 22.743-40.946 31.14Zm-10.514 20.834c2.562 12.94 2.927 24.64 1.23 33.787c-1.524 8.219-4.59 13.698-8.382 15.893c-8.067 4.67-25.32-1.4-43.927-17.412a156.726 156.726 0 0 1-6.437-5.87c7.214-7.889 14.423-17.06 21.459-27.246c12.376-1.098 24.068-2.894 34.671-5.345a134.17 134.17 0 0 1 1.386 6.193ZM87.276 214.515c-7.882 2.783-14.16 2.863-17.955.675c-8.075-4.657-11.432-22.636-6.853-46.752a156.923 156.923 0 0 1 1.869-8.499c10.486 2.32 22.093 3.988 34.498 4.994c7.084 9.967 14.501 19.128 21.976 27.15a134.668 134.668 0 0 1-4.877 4.492c-9.933 8.682-19.886 14.842-28.658 17.94ZM50.35 144.747c-12.483-4.267-22.792-9.812-29.858-15.863c-6.35-5.437-9.555-10.836-9.555-15.216c0-9.322 13.897-21.212 37.076-29.293c2.813-.98 5.757-1.905 8.812-2.773c3.204 10.42 7.406 21.315 12.477 32.332c-5.137 11.18-9.399 22.249-12.634 32.792a134.718 134.718 0 0 1-6.318-1.979Zm12.378-84.26c-4.811-24.587-1.616-43.134 6.425-47.789c8.564-4.958 27.502 2.111 47.463 19.835a144.318 144.318 0 0 1 3.841 3.545c-7.438 7.987-14.787 17.08-21.808 26.988c-12.04 1.116-23.565 2.908-34.161 5.309a160.342 160.342 0 0 1-1.76-7.887Zm110.427 27.268a347.8 347.8 0 0 0-7.785-12.803c8.168 1.033 15.994 2.404 23.343 4.08c-2.206 7.072-4.956 14.465-8.193 22.045a381.151 381.151 0 0 0-7.365-13.322Zm-45.032-43.861c5.044 5.465 10.096 11.566 15.065 18.186a322.04 322.04 0 0 0-30.257-.006c4.974-6.559 10.069-12.652 15.192-18.18ZM82.802 87.83a323.167 323.167 0 0 0-7.227 13.238c-3.184-7.553-5.909-14.98-8.134-22.152c7.304-1.634 15.093-2.97 23.209-3.984a321.524 321.524 0 0 0-7.848 12.897Zm8.081 65.352c-8.385-.936-16.291-2.203-23.593-3.793c2.26-7.3 5.045-14.885 8.298-22.6a321.187 321.187 0 0 0 7.257 13.246c2.594 4.48 5.28 8.868 8.038 13.147Zm37.542 31.03c-5.184-5.592-10.354-11.779-15.403-18.433c4.902.192 9.899.29 14.978.29c5.218 0 10.376-.117 15.453-.343c-4.985 6.774-10.018 12.97-15.028 18.486Zm52.198-57.817c3.422 7.8 6.306 15.345 8.596 22.52c-7.422 1.694-15.436 3.058-23.88 4.071a382.417 382.417 0 0 0 7.859-13.026a347.403 347.403 0 0 0 7.425-13.565Zm-16.898 8.101a358.557 358.557 0 0 1-12.281 19.815a329.4 329.4 0 0 1-23.444.823c-7.967 0-15.716-.248-23.178-.732a310.202 310.202 0 0 1-12.513-19.846h.001a307.41 307.41 0 0 1-10.923-20.627a310.278 310.278 0 0 1 10.89-20.637l-.001.001a307.318 307.318 0 0 1 12.413-19.761c7.613-.576 15.42-.876 23.31-.876H128c7.926 0 15.743.303 23.354.883a329.357 329.357 0 0 1 12.335 19.695a358.489 358.489 0 0 1 11.036 20.54a329.472 329.472 0 0 1-11 20.722Zm22.56-122.124c8.572 4.944 11.906 24.881 6.52 51.026c-.344 1.668-.73 3.367-1.15 5.09c-10.622-2.452-22.155-4.275-34.23-5.408c-7.034-10.017-14.323-19.124-21.64-27.008a160.789 160.789 0 0 1 5.888-5.4c18.9-16.447 36.564-22.941 44.612-18.3ZM128 90.808c12.625 0 22.86 10.235 22.86 22.86s-10.235 22.86-22.86 22.86s-22.86-10.235-22.86-22.86s10.235-22.86 22.86-22.86Z"></path></svg>`,
                    folderId: assetsFolderId,
                },
                // Src files
                {
                    name: "main.tsx",
                    content: `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)`,
                    folderId: srcFolderId,
                },
                {
                    name: "App.tsx",
                    content: `import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import { Button } from "./components/ui/button";

function App() {
    const [count, setCount] = useState(0);

    return (
        <>
            <div className="w-screen h-screen flex flex-col items-center justify-center gap-4 bg-indigo-300">
                <div className="flex items-center justify-center gap-10">
                    <a href="https://vite.dev" target="_blank">
                        <img src={viteLogo} className="w-32" alt="Vite logo" />
                    </a>
                    <a href="https://react.dev" target="_blank">
                        <img
                            src={reactLogo}
                            className="w-32"
                            alt="React logo"
                        />
                    </a>
                </div>
                <div className="font-bold text-3xl">
                    Start Building with Vanadium's z9
                </div>
                <p className="text-base">and create amazing Vite React apps.</p>
                <div className="flex flex-col items-center justify-center gap-4 mt-8">
                    <Button
                        className="cursor-pointer"
                        onClick={() => setCount((count) => count + 1)}
                    >
                        count is {count}
                    </Button>
                    <p>
                        Edit <code>src/App.tsx</code> and save to test HMR
                    </p>
                </div>
            </div>
        </>
    );
}

export default App;
`,
                    folderId: srcFolderId,
                },
                {
                    name: "index.css",
                    content: `@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}`,
                    folderId: srcFolderId,
                },
                {
                    name: "vite-env.d.ts",
                    content: `/// <reference types="vite/client" />`,
                    folderId: srcFolderId,
                },
                {
                    name: "utils.ts",
                    content: `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`,
                    folderId: libFolderId,
                },
                {
                    name: "button.tsx",
                    content: `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
`,
                    folderId: uiFolderId,
                },
                {
                    name: "accordion.tsx",
                    content: `import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
`,
                    folderId: uiFolderId,
                },
                {
                    name: "alert.tsx",
                    content: `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
`,
                    folderId: uiFolderId,
                },
                {
                    name: "alert-dialog.tsx",
                    content: `"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants(), className)}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
`,
                    folderId: uiFolderId,
                },
                {
                    name: "aspect-ratio.tsx",
                    content: `import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />
}

export { AspectRatio }
`,
                    folderId: uiFolderId,
                },
                {
                    name: "avatar.tsx",
                    content: `"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
`,
                    folderId: uiFolderId,
                },
                {
                    name: "badge.tsx",
                    content: `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
`,
                    folderId: uiFolderId,
                },
            ];

            for (const file of defaultFiles) {
                const fileResult = await chatHandler.current.createFile(
                    versionId,
                    file.folderId,
                    file.name,
                    file.content
                );
                if ("err" in fileResult) {
                    console.error(
                        `Failed to create file ${file.name}:`,
                        fileResult.err
                    );
                } else {
                    console.log(
                        `Successfully created file: ${file.name}`,
                        fileResult.ok
                    );
                    if (
                        file.folderId &&
                        fileResult.ok.folderId?.[0] !== file.folderId
                    ) {
                        console.warn(
                            `FolderId mismatch for ${file.name}: expected ${file.folderId}, got ${fileResult.ok.folderId?.[0]}`
                        );
                    }
                }
            }

            await loadChats();
            setCurrentChat(chatId.toString());
            await loadProjectFiles(chatId); // Add this to load the file tree immediately
        } catch (error) {
            console.error("Failed to create new project:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFolder = (nodeId: number) => {
        const updateTree = (nodes: FileNode[]): FileNode[] => {
            return nodes.map((node) => {
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
            setActiveTab("code");
        }
    };

    const updateFileContent = async (content: string) => {
        if (!selectedFile || !currentProjectVersion) return;

        try {
            const result = await chatHandler.current.updateFile(
                selectedFile.id,
                undefined,
                undefined,
                content
            );

            if ("ok" in result) {
                setSelectedFile({ ...selectedFile, content });

                const updateTree = (nodes: FileNode[]): FileNode[] => {
                    return nodes.map((node) => {
                        if (node.id === selectedFile.id) {
                            return { ...node, content };
                        }
                        if (node.children) {
                            return {
                                ...node,
                                children: updateTree(node.children),
                            };
                        }
                        return node;
                    });
                };
                setFileTree(updateTree(fileTree));

                if (webContainer) {
                    const filePath = getFilePathFromTree(
                        selectedFile.id,
                        fileTree
                    );
                    if (filePath) {
                        await webContainer.fs.writeFile(filePath, content);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to update file:", error);
        }
    };

    const getFilePathFromTree = (
        fileId: number,
        nodes: FileNode[],
        currentPath = ""
    ): string | null => {
        for (const node of nodes) {
            const nodePath = currentPath
                ? `${currentPath}/${node.name}`
                : node.name;

            if (node.id === fileId) {
                return nodePath;
            }

            if (node.children) {
                const result = getFilePathFromTree(
                    fileId,
                    node.children,
                    nodePath
                );
                if (result) return result;
            }
        }
        return null;
    };

    const renderFileTree = (nodes: FileNode[], depth = 0) => {
        return nodes.map((node) => (
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
                    <div>{renderFileTree(node.children, depth + 1)}</div>
                )}
            </div>
        ));
    };

    const captureCanvasScreenshot = () => {
        const canvas = canvasRef.current;
        console.log("Canvas Ref:", canvas); // Debug log
        if (canvas) {
            const screenshot = canvas.toDataURL("image/png");
            setCanvasScreenshot(screenshot);
            console.log("Captured Canvas Data:", screenshot); // Debug log
            return screenshot;
        }
        console.warn("Canvas not available for capture");
        return null;
    };

    const getFolderIdFromPath = (
        path: string,
        nodes: FileNode[]
    ): number | undefined => {
        const parts = path
            .split("/")
            .filter((part) => part && part !== path.split("/").pop());
        let currentFolderId: number | undefined;

        console.log("Resolving path:", path, "with folder parts:", parts);

        for (const part of parts) {
            if (part === "src" && !currentFolderId) {
                const srcNode = nodes.find(
                    (n) =>
                        n.type === "folder" && n.name === "src" && !n.parentId
                );
                if (srcNode) {
                    currentFolderId = srcNode.id;
                    console.log("Found src folder ID:", currentFolderId);
                } else {
                    console.warn(
                        "src folder not found in root nodes:",
                        nodes.map((n) => n.name)
                    );
                    return undefined;
                }
            } else {
                const folderNode = nodes.find(
                    (n) =>
                        n.type === "folder" &&
                        n.name === part &&
                        (!currentFolderId || n.parentId === currentFolderId)
                );
                if (folderNode) {
                    currentFolderId = folderNode.id;
                    console.log(
                        "Found folder ID for",
                        part,
                        ":",
                        currentFolderId
                    );
                } else {
                    console.warn(
                        `Folder ${part} not found under parent ID ${currentFolderId}`
                    );
                    return undefined;
                }
            }
        }
        return currentFolderId;
    };

    const findFileNodeByPath = (
        path: string,
        nodes: FileNode[]
    ): FileNode | undefined => {
        const parts = path.split("/").filter((part) => part); // Split into path segments
        const fileName = parts.pop()!.replace(/\.tsx$/, ""); // Remove .tsx from the last segment
        const folderPath = parts.join("/"); // Reconstruct folder path

        const search = (
            nodes: FileNode[],
            currentPath: string = ""
        ): FileNode | undefined => {
            for (const node of nodes) {
                const nodeFullPath = currentPath
                    ? `${currentPath}/${node.name}`
                    : node.name;
                const nodeBaseName = node.name.replace(/\.tsx$/, "");

                if (
                    node.type === "file" &&
                    nodeBaseName === fileName &&
                    nodeFullPath === path
                ) {
                    return node;
                }
                if (node.type === "folder" && node.children) {
                    const found = search(node.children, nodeFullPath);
                    if (found) return found;
                }
            }
            return undefined;
        };

        return search(nodes);
    };

    const applyQuickEdit = (content: string, instructions: string): string => {
        let updatedContent = content;
        const lines = instructions.split("\n");
        for (const line of lines) {
            if (line.startsWith("- Replace")) {
                const [_, target, newCode] =
                    line.match(/- Replace (.*) with\s*([\s\S]*)/) || [];
                if (target && newCode) {
                    updatedContent = updatedContent.replace(
                        new RegExp(target, "g"),
                        newCode.trim()
                    );
                }
            } else if (line.startsWith("- Add")) {
                const [_, position, newCode] =
                    line.match(/- Add (.*) with\s*([\s\S]*)/) || [];
                if (position === "after" && newCode) {
                    updatedContent += `\n${newCode.trim()}`;
                }
            } else if (line.startsWith("- Remove")) {
                const [_, target] = line.match(/- Remove (.*)/) || [];
                if (target) {
                    updatedContent = updatedContent.replace(
                        new RegExp(target, "g"),
                        ""
                    );
                }
            }
        }
        return updatedContent;
    };

    const updateFileTreeWithNewFile = (
        fileId: number,
        path: string,
        content: string
    ) => {
        const parts = path.split("/");
        const fileName = parts.pop()!;
        const newNode: FileNode = {
            id: fileId,
            name: fileName,
            type: "file",
            content,
            parentId: getFolderIdFromPath(path, fileTree),
            path,
        };
        setFileTree((prev) => {
            const updateTree = (nodes: FileNode[]): FileNode[] => {
                return nodes.map((node) => {
                    if (
                        node.parentId === newNode.parentId &&
                        node.type === "folder"
                    ) {
                        return {
                            ...node,
                            children: [...(node.children || []), newNode],
                        };
                    }
                    if (node.children) {
                        return { ...node, children: updateTree(node.children) };
                    }
                    return node;
                });
            };
            return updateTree([...prev]);
        });
    };

    const updateFileTreeAfterDeletion = (fileId: number) => {
        setFileTree((prev) => prev.filter((node) => node.id !== fileId));
    };

    const updateFileTreeAfterMove = (fileId: number, newPath: string) => {
        setFileTree((prev) => {
            const newTree = [...prev];
            const fileNode = findFileNodeByPath(
                newPath.split("/").pop()!,
                newTree
            );
            if (fileNode) {
                fileNode.name = newPath.split("/").pop()!;
                fileNode.parentId = getFolderIdFromPath(newPath, newTree);
                fileNode.path = newPath;
            }
            return newTree;
        });
    };

    const updateImportsAfterMove = async (oldPath: string, newPath: string) => {
        const oldFileName = oldPath.split("/").pop()!;
        const newFileName = newPath.split("/").pop()!;
        fileTree.forEach(async (node) => {
            if (node.type === "file" && node.content) {
                const updatedContent = node.content.replace(
                    new RegExp(`from ['"]${oldFileName}['"]`, "g"),
                    `from '${newFileName}'`
                );
                if (updatedContent !== node.content) {
                    await updateFileContent(updatedContent);
                }
            }
        });
    };

    const updateFileTreeWithExistingFile = async (node: FileNode) => {
        setFileTree((prev) => {
            const newTree = [...prev];
            const updateNode = (nodes: FileNode[]): FileNode[] => {
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i].id === node.id) {
                        const updatedNode = {
                            ...nodes[i],
                            ...node,
                            path: node.path,
                            parentId: node.parentId,
                        };
                        nodes.splice(i, 1);
                        const parentNode = newTree.find(
                            (n) => n.id === node.parentId && n.type === "folder"
                        );
                        if (parentNode) {
                            (parentNode.children =
                                parentNode.children || []).push(updatedNode);
                        } else if (!node.parentId) {
                            newTree.push(updatedNode);
                        }
                        return nodes;
                    }
                    if (nodes[i].children) {
                        nodes[i].children = updateNode(nodes[i].children ?? []);
                    }
                }
                return nodes;
            };
            updateNode(newTree);
            return newTree;
        });
    };

    const getFolderPathFromId = (folderId: number): string => {
        const node = fileTree.find(
            (n) => n.id === folderId && n.type === "folder"
        );
        if (!node) return "";
        return node.path || node.name;
    };

    const ensureFolder = async (
        versionId: number,
        parentId: number | undefined,
        folderName: string
    ): Promise<number> => {
        const existingFolder = fileTree.find(
            (n) =>
                n.type === "folder" &&
                n.name === folderName &&
                n.parentId === parentId
        );
        if (existingFolder) return existingFolder.id;

        const folderResult = await chatHandler.current.createFolder(
            versionId,
            folderName,
            parentId
        );
        if ("ok" in folderResult) {
            const newFolderId = Number(folderResult.ok.id);
            const newFolderNode: FileNode = {
                id: newFolderId,
                name: folderName,
                type: "folder",
                children: [],
                isOpen: false,
                path: parentId
                    ? `${getFolderPathFromId(parentId)}/${folderName}`
                    : folderName,
                parentId,
            };
            setFileTree((prev) => {
                const updateTree = (nodes: FileNode[]): FileNode[] => {
                    return nodes.map((node) => {
                        if (node.id === parentId && node.type === "folder") {
                            return {
                                ...node,
                                children: [
                                    ...(node.children || []),
                                    newFolderNode,
                                ],
                            };
                        }
                        if (node.children) {
                            return {
                                ...node,
                                children: updateTree(node.children),
                            };
                        }
                        return node;
                    });
                };
                return updateTree([...prev]);
            });
            return newFolderId;
        }
        throw new Error("Failed to create folder");
    };

    const sendMessage = async () => {
        if (!input.trim() || !currentChat) return;

        try {
            setIsLoading(true);
            const chatId = parseInt(currentChat);

            let canvasData = null;
            if (includeCanvas && activeTab === "canvas") {
                canvasData = captureCanvasScreenshot(); // Get the full data URL
                console.log("Canvas Data Sent:", canvasData);
            }

            await chatHandler.current.createMessage(
                chatId,
                { user: null },
                input,
                currentProjectVersion
                    ? Number(currentProjectVersion.id)
                    : undefined
            );

            await loadMessages(chatId);
            setInput("");

            setThinking(true); // Set thinking state for UI feedback

            const aiResponse = await aiService.sendMessage(
                input,
                canvasData, // Pass the full canvas data URL directly
                fileTree
            );

            console.log("AI Response:", aiResponse);

            // Handle thinking content only for UI display, not for saving
            if (aiResponse.thinking) {
                setThinking(true); // Keep thinking indicator active during processing
            }

            if (aiResponse.actions) {
                setSuggestedActions(aiResponse.actions);
            }

            if (aiResponse.codeProject) {
                // Adjust file paths to ensure they start with src/
                const adjustedCodeProject = {
                    ...aiResponse.codeProject,
                    files: aiResponse.codeProject.files.map((file) => {
                        let fullPath = file.path;
                        if (
                            !fullPath.startsWith("src/") &&
                            !fullPath.startsWith("/src/")
                        ) {
                            fullPath = `src/${fullPath}`;
                        }
                        return { ...file, path: fullPath };
                    }),
                };
                console.log(
                    "Adjusted aiResponse.codeProject:",
                    adjustedCodeProject
                );
                await handleCodeProject(adjustedCodeProject, chatId);
            }

            // Extract untagged text between <CodeProject> and <Actions>, ignoring <Thinking>
            let untaggedText = aiResponse.content || "";
            const codeProjectMatch = untaggedText.match(
                /<CodeProject id="([^"]+)">([\s\S]*?)<\/CodeProject>/
            );
            if (codeProjectMatch) {
                untaggedText = untaggedText
                    .substring(untaggedText.indexOf("</CodeProject>") + 12)
                    .trim(); // Start after </CodeProject>
            }
            const actionsMatch = untaggedText.match(
                /<Actions>([\s\S]*?)<\/Actions>/
            );
            if (actionsMatch) {
                untaggedText = untaggedText
                    .substring(0, untaggedText.indexOf("<Actions>"))
                    .trim();
            }
            // Trim any leading or trailing artifacts
            untaggedText = untaggedText.trim();

            // Split the string into an array of lines
            const lines: string[] = untaggedText.split("\n");

            // Remove the first two lines
            const remainingLines: string[] = lines.slice(2);

            // Join the remaining lines back into a string
            const resultString: string = remainingLines.join("\n");

            // Save only the extracted and cleaned untagged text as the final message
            if (untaggedText) {
                await chatHandler.current
                    .createMessage(
                        chatId,
                        { ai: null },
                        resultString,
                        currentProjectVersion
                            ? Number(currentProjectVersion.id)
                            : undefined
                    )
                    .catch((error) =>
                        console.error("Failed to save AI response:", error)
                    );
            } else if (!aiResponse.codeProject && !aiResponse.actions) {
                // Save a default message if no meaningful content is found
                await chatHandler.current
                    .createMessage(
                        chatId,
                        { ai: null },
                        "No additional response content.",
                        currentProjectVersion
                            ? Number(currentProjectVersion.id)
                            : undefined
                    )
                    .catch((error) =>
                        console.error("Failed to save default response:", error)
                    );
            }

            await loadMessages(chatId);
            setThinking(false); // Clear thinking indicator after processing
            setInput("");
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setIsLoading(false);
        }
    };
    const handleCodeProject = async (
        project: AIResponse["codeProject"],
        chatId: number
    ) => {
        if (!webContainer || !currentProjectVersion || !fileTreeReady) return;

        const versionId = Number(currentProjectVersion.id);
        const updatedFiles = new Set<string>();

        if (project && project.files) {
            for (const file of project.files) {
                let fullPath = file.path;
                if (!fullPath.includes("/") && !fullPath.startsWith("src/")) {
                    fullPath = `src/${fullPath}`;
                }
                const folderId = await getFolderIdFromPath(fullPath, fileTree);
                console.log(`Resolved ${fullPath} to folderId: ${folderId}`);
                const fileName = fullPath.split("/").pop()!;

                const existingFile = findFileNodeByPath(fullPath, fileTree);
                if (existingFile) {
                    await chatHandler.current.updateFile(
                        existingFile.id,
                        folderId,
                        undefined,
                        file.content
                    );
                    await updateFileContent(file.content);
                    if (webContainer)
                        await webContainer.fs.writeFile(fullPath, file.content);
                    const updatedNode = {
                        ...existingFile,
                        content: file.content,
                        path: fullPath,
                        parentId: folderId,
                    };
                    console.log(
                        `Updated node for ${fullPath} with parentId: ${folderId}`
                    );
                    await updateFileTreeWithExistingFile(updatedNode);
                } else if (folderId !== undefined) {
                    const fileResult = await chatHandler.current.createFile(
                        versionId,
                        folderId,
                        fileName,
                        file.content
                    );
                    if ("ok" in fileResult) {
                        console.log(
                            `Created file ${fileName} with id ${fileResult.ok.id} under folderId ${folderId}`
                        );
                        const newFileId = Number(fileResult.ok.id);
                        await updateFileTreeWithNewFile(
                            newFileId,
                            fullPath,
                            file.content
                        );
                        if (webContainer)
                            await webContainer.fs.writeFile(
                                fullPath,
                                file.content
                            );
                    }
                } else {
                    console.warn(
                        `No valid folder for ${fullPath}, creating in src/ as fallback`
                    );
                    const baseFolderId = await getFolderIdFromPath(
                        "src",
                        fileTree
                    );
                    if (baseFolderId) {
                        const fileResult = await chatHandler.current.createFile(
                            versionId,
                            baseFolderId,
                            fileName,
                            file.content
                        );
                        if ("ok" in fileResult) {
                            console.log(
                                `Fallback created file ${fileName} with id ${fileResult.ok.id} under folderId ${baseFolderId}`
                            );
                            const newFileId = Number(fileResult.ok.id);
                            await updateFileTreeWithNewFile(
                                newFileId,
                                `src/${fileName}`,
                                file.content
                            );
                            if (webContainer)
                                await webContainer.fs.writeFile(
                                    `src/${fileName}`,
                                    file.content
                                );
                        }
                    }
                }
                updatedFiles.add(fullPath);
            }

            project.files.forEach((file) => {
                const fullPath = file.path.includes("/")
                    ? file.path
                    : `src/${file.path}`;
                const existingNode = findFileNodeByPath(fullPath, fileTree);
                if (existingNode && existingNode.content !== file.content) {
                    console.warn(
                        `Content mismatch for ${fullPath}. Expected: ${file.content.substring(0, 50)}..., Found: ${existingNode.content?.substring(0, 50)}...`
                    );
                }
            });
        }

        await loadProjectFiles(chatId); // Force reload if supported
    };

    const formatTimestamp = (timestamp: bigint) => {
        return new Date(Number(timestamp) / 1000000).toLocaleString();
    };

    if (!user) {
        return (
            <div className="h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center max-w-md">
                    <User className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                    <h1 className="text-2xl font-bold mb-4">
                        Authentication Required
                    </h1>
                    <p className="text-gray-400 mb-6">
                        Please log in to access your projects and start building
                        with vanadium.
                    </p>
                    <Button asChild size="lg">
                        <Link to="/">
                            <LogIn className="w-4 h-4 mr-2" />
                            Go to Home Page
                        </Link>
                    </Button>
                </div>
            </div>
        );
    } else if (!currentChat) {
        return (
            <div className="h-screen bg-black text-white flex">
                {sidebarOpen && (
                    <ChatSidebar
                        chats={chats}
                        currentChat={currentChat}
                        onSelectChat={setCurrentChat}
                        onClose={() => setSidebarOpen(false)}
                        onNewProject={createNewProject}
                    />
                )}

                <div className="flex-1 flex flex-col">
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
                            <Button
                                onClick={createNewProject}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4 mr-2" />
                                )}
                                New Project
                            </Button>
                        </div>
                    </header>

                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center max-w-2xl px-6">
                            <MessageSquare className="w-20 h-20 mx-auto mb-8 text-gray-600" />
                            <h2 className="text-3xl font-bold mb-4">
                                Welcome to vanadium
                            </h2>
                            <p className="text-xl text-gray-400 mb-8">
                                Create stunning React applications with the
                                power of AI. Start a new project or select an
                                existing one from the sidebar.
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
                                        <Button
                                            onClick={createNewProject}
                                            disabled={isLoading}
                                        >
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
                                        No projects yet. Create your first
                                        project to get started.
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
        <div className="h-screen bg-black text-white flex">
            {sidebarOpen && (
                <ChatSidebar
                    chats={chats}
                    currentChat={currentChat}
                    onSelectChat={setCurrentChat}
                    onClose={() => setSidebarOpen(false)}
                    onNewProject={createNewProject}
                />
            )}

            <div className="w-80 border-r border-gray-800 bg-gray-950 flex flex-col">
                <div className="border-b border-gray-800 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                        <h3 className="text-sm font-medium text-gray-300">
                            Chat
                        </h3>
                    </div>
                    <Button
                        onClick={createNewProject}
                        disabled={isLoading}
                        size="sm"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                            <Plus className="w-4 h-4 mr-1" />
                        )}
                        New
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No messages yet</p>
                            <p className="text-xs">
                                Start a conversation below
                            </p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id.toString()}
                                className="space-y-2"
                            >
                                <div
                                    className={`flex ${
                                        "user" in message.sender
                                            ? "justify-end"
                                            : "justify-start"
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
                    {thinking && (
                        <div className="space-y-2">
                            <div
                                className={`flex "justify-start"
                                    }`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg p-3 text-sm "bg-gray-800 text-gray-100"
                                        }`}
                                >
                                    <div className="whitespace-pre-wrap">
                                        <div className="lexend-200">
                                            z9 is thinking . . .
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-800 p-4">
                    {activeTab === "canvas" && (
                        <div className="mb-3 flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="includeCanvas"
                                checked={includeCanvas}
                                onChange={(e) =>
                                    setIncludeCanvas(e.target.checked)
                                }
                                className="rounded border-gray-600 bg-gray-800 text-purple-glow focus:ring-purple-glow"
                            />
                            <label
                                htmlFor="includeCanvas"
                                className="text-sm text-gray-300"
                            >
                                Include canvas in prompt
                            </label>
                        </div>
                    )}
                    <div className="flex space-x-2">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={
                                activeTab === "canvas" && includeCanvas
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
                    {/* {thinking && (
                        <div className="mt-2 text-sm text-gray-400 italic">
                            {thinking}
                        </div>
                    )} */}
                    {suggestedActions.length > 0 && (
                        <div className="mt-2 text-sm text-gray-300">
                            <strong>Suggested Actions:</strong>
                            <ul className="list-disc pl-5">
                                {suggestedActions.map((action, index) => (
                                    <li key={index}>
                                        {action.name} - {action.description}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {activeTab === "canvas" && includeCanvas && (
                        <p className="text-xs text-gray-500 mt-2">
                            💡 Your canvas drawing will be included with your
                            prompt
                        </p>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                <header className="border-b border-gray-800 p-4 flex items-center justify-between">
                    <h1 className="text-xl font-semibold">
                        Project {currentChat}
                    </h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-400">
                            Welcome, {user?.username}
                        </span>
                    </div>
                </header>

                <div className="flex-1 flex">
                    <div className="w-64 border-r border-gray-800 bg-gray-950">
                        <div className="p-3 border-b border-gray-800">
                            <h3 className="text-sm font-medium text-gray-300">
                                Explorer
                            </h3>
                        </div>
                        <div className="overflow-y-auto">
                            {fileTreeReady && fileTree.length > 0 ? (
                                renderFileTree(fileTree)
                            ) : (
                                <div className="p-4 text-sm text-gray-500 text-center">
                                    {fileTreeReady
                                        ? "No files yet"
                                        : "Loading files..."}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col">
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
                                                    code={
                                                        selectedFile.content ||
                                                        ""
                                                    }
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
                                <div className="flex-1 relative">
                                    <CanvasPane
                                        onCanvasCapture={(
                                            dataUrl,
                                            description
                                        ) => {
                                            setCanvasScreenshot(dataUrl);
                                        }}
                                        showPreview={true}
                                        previewContent={
                                            previewUrl ? (
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
                                            )
                                        }
                                    />
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