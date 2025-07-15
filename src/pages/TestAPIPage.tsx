import React, { useState, useEffect } from "react";
import { useUser } from "@/context/AuthContext";
import { ChatSystemHandler } from "@/handler/ChatSystemHandler";
import {
    Chat,
    File as FileType,
    Folder,
    Message,
    ProjectVersion,
} from "@/declarations/chat_system_service/chat_system_service.did";
import Beams from "@/components/backgrounds/Beams/Beams";

const TestAPIPage: React.FC = () => {
    const { user, principal } = useUser();
    const [chatHandler] = useState(() => new ChatSystemHandler());
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [files, setFiles] = useState<FileType[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [projectVersions, setProjectVersions] = useState<ProjectVersion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (principal) {
            loadChats();
        }
    }, [principal]);

    const loadChats = async () => {
        if (!principal) return;
        
        setLoading(true);
        setError("");
        
        try {
            const result = await chatHandler.getAllChatByUserId(principal);
            if ("ok" in result) {
                setChats(result.ok);
                console.log("Loaded chats:", result.ok);
            } else {
                setError(`Failed to load chats: ${result.err}`);
            }
        } catch (err) {
            setError(`Error loading chats: ${(err as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    const loadChatData = async (chat: Chat) => {
        setSelectedChat(chat);
        setLoading(true);
        setError("");

        try {
            // Load messages
            const messagesResult = await chatHandler.getAllMessageByChatId(Number(chat.id));
            if ("ok" in messagesResult) {
                setMessages(messagesResult.ok);
            }

            // Load project versions
            const versionsResult = await chatHandler.getAllProjectVersionByChatId(Number(chat.id));
            if ("ok" in versionsResult) {
                setProjectVersions(versionsResult.ok);
                
                // If there are versions, load files and folders for the latest one
                if (versionsResult.ok.length > 0) {
                    const latestVersion = versionsResult.ok[versionsResult.ok.length - 1];
                    
                    const [filesResult, foldersResult] = await Promise.all([
                        chatHandler.getAllFileByProjectVersionId(Number(latestVersion.id)),
                        chatHandler.getAllFolderByProjectVersionId(Number(latestVersion.id))
                    ]);

                    if ("ok" in filesResult) {
                        setFiles(filesResult.ok);
                    }
                    if ("ok" in foldersResult) {
                        setFolders(foldersResult.ok);
                    }
                }
            }
        } catch (err) {
            setError(`Error loading chat data: ${(err as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    const createTestProject = async () => {
        if (!principal) return;

        setLoading(true);
        setError("");

        try {
            // Create new chat
            const chatResult = await chatHandler.createChat("Test Project");
            if ("err" in chatResult) {
                throw new Error(chatResult.err);
            }

            const newChat = chatResult.ok;
            const chatId = Number(newChat.id);

            // Create project version
            const versionResult = await chatHandler.createProjectVersion(
                chatId,
                1,
                "Initial test project setup"
            );
            if ("err" in versionResult) {
                throw new Error(versionResult.err);
            }

            const version = versionResult.ok;
            const versionId = Number(version.id);

            // Create src folder
            const srcFolderResult = await chatHandler.createFolder(versionId, "src");
            if ("err" in srcFolderResult) {
                throw new Error(srcFolderResult.err);
            }
            const srcFolderId = Number(srcFolderResult.ok.id);

            // Create components folder inside src
            const componentsFolderResult = await chatHandler.createFolder(versionId, "components", srcFolderId);
            if ("err" in componentsFolderResult) {
                throw new Error(componentsFolderResult.err);
            }
            const componentsFolderId = Number(componentsFolderResult.ok.id);

            // Create test files
            const testFiles = [
                {
                    name: "App.jsx",
                    content: `import React from 'react';
import Header from './components/Header';

function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <h1>Welcome to Test Project</h1>
        <p>This is a test project created via API.</p>
      </main>
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
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);`,
                    folderId: srcFolderId
                },
                {
                    name: "index.css",
                    content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app {
  text-align: center;
}`,
                    folderId: srcFolderId
                },
                {
                    name: "Header.jsx",
                    content: `import React from 'react';

function Header() {
  return (
    <header style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
      <h2>Test Project Header</h2>
    </header>
  );
}

export default Header;`,
                    folderId: componentsFolderId
                }
            ];

            // Create files
            for (const file of testFiles) {
                const fileResult = await chatHandler.createFile(
                    versionId,
                    file.folderId,
                    file.name,
                    file.content
                );
                if ("err" in fileResult) {
                    console.error(`Failed to create file ${file.name}:`, fileResult.err);
                }
            }

            // Create a test message
            await chatHandler.createMessage(
                chatId,
                { user: null },
                "Create a simple React app with a header component",
                versionId
            );

            // Reload chats
            await loadChats();
            
        } catch (err) {
            setError(`Error creating test project: ${(err as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    const formatTimestamp = (timestamp: bigint) => {
        return new Date(Number(timestamp) / 1000000).toLocaleString();
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Please log in</h1>
                    <p>You need to be logged in to test the API.</p>
                </div>
            </div>
        );
    }

    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Chat System API Test</h1>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Controls */}
            <div className="space-y-6">
              <div className="bg-gray-900 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Controls</h2>
                <div className="space-y-3">
                  <button
                    onClick={loadChats}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    {loading ? "Loading..." : "Load Chats"}
                  </button>
                  <button
                    onClick={createTestProject}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    {loading ? "Creating..." : "Create Test Project"}
                  </button>
                </div>
              </div>

              {/* Chats List */}
              <div className="bg-gray-900 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">
                  Chats ({chats.length})
                </h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {chats.map((chat) => (
                    <div
                      key={chat.id.toString()}
                      onClick={() => loadChatData(chat)}
                      className={`p-3 rounded cursor-pointer transition-colors ${
                        selectedChat?.id === chat.id
                          ? "bg-blue-600"
                          : "bg-gray-800 hover:bg-gray-700"
                      }`}
                    >
                      <div className="font-medium">
                        {chat.title?.[0] || `Chat ${chat.id}`}
                      </div>
                      <div className="text-sm text-gray-400">
                        ID: {chat.id.toString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTimestamp(chat.createdAt)}
                      </div>
                    </div>
                  ))}
                  {chats.length === 0 && (
                    <div className="text-gray-500 text-center py-4">
                      No chats found
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Chat Data */}
            <div className="space-y-6">
              {selectedChat && (
                <>
                  {/* Messages */}
                  <div className="bg-gray-900 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">
                      Messages ({messages.length})
                    </h2>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {messages.map((message) => (
                        <div
                          key={message.id.toString()}
                          className="bg-gray-800 p-3 rounded"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span
                              className={`text-sm font-medium ${
                                "user" in message.sender
                                  ? "text-blue-400"
                                  : "text-green-400"
                              }`}
                            >
                              {"user" in message.sender ? "User" : "AI"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(message.createdAt)}
                            </span>
                          </div>
                          <div className="text-sm">{message.content}</div>
                        </div>
                      ))}
                      {messages.length === 0 && (
                        <div className="text-gray-500 text-center py-4">
                          No messages
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Versions */}
                  <div className="bg-gray-900 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">
                      Project Versions ({projectVersions.length})
                    </h2>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {projectVersions.map((version) => (
                        <div
                          key={version.id.toString()}
                          className="bg-gray-800 p-2 rounded"
                        >
                          <div className="text-sm font-medium">
                            Version {version.versionNumber.toString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {version.snapshot}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Folders */}
                  <div className="bg-gray-900 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">
                      Folders ({folders.length})
                    </h2>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {folders.map((folder) => (
                        <div
                          key={folder.id.toString()}
                          className="bg-gray-800 p-2 rounded text-sm"
                        >
                          📁 {folder.name}
                          {folder.parentId?.[0] && (
                            <span className="text-gray-500 ml-2">
                              (parent: {folder.parentId[0].toString()})
                            </span>
                          )}
                        </div>
                      ))}
                      {folders.length === 0 && (
                        <div className="text-gray-500 text-center py-2">
                          No folders
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Files */}
                  <div className="bg-gray-900 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">
                      Files ({files.length})
                    </h2>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {files.map((file) => (
                        <div
                          key={file.id.toString()}
                          className="bg-gray-800 p-3 rounded"
                        >
                          <div className="font-medium text-sm">
                            📄 {file.name}
                          </div>
                          {file.folderId?.[0] && (
                            <div className="text-xs text-gray-500 mb-2">
                              Folder ID: {file.folderId[0].toString()}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 bg-gray-900 p-2 rounded max-h-20 overflow-y-auto">
                            {file.content.substring(0, 200)}
                            {file.content.length > 200 && "..."}
                          </div>
                        </div>
                      ))}
                      {files.length === 0 && (
                        <div className="text-gray-500 text-center py-2">
                          No files
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
};

export default TestAPIPage;