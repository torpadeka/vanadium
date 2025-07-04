"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/context/AuthContext";
import { ChatSystemHandler } from "@/handler/ChatSystemHandler";
import { Principal } from "@dfinity/principal";

interface Message {
  type: "success" | "error";
  content: string;
}

export default function TestAPIPage() {
  const { isAuthenticated, principal, login } = useUser();
  const [handler] = useState(() => new ChatSystemHandler());

  // Chat section states
  const [chat, setChat] = useState({
    id: "",
    title: "",
    userId: "",
    newTitle: "",
  });

  // File section states
  const [file, setFile] = useState({
    id: "",
    versionId: "",
    folderId: "",
    name: "",
    content: "",
    newName: "",
    newContent: "",
    newFolderId: "",
  });

  // Folder section states
  const [folder, setFolder] = useState({
    id: "",
    versionId: "",
    name: "",
    parentId: "",
    newName: "",
    newParentId: "",
  });

  // Message section states
  const [message, setMessage] = useState({
    id: "",
    chatId: "",
    content: "",
    referencedVersion: "",
    newContent: "",
  });

  // Project Version section states
  const [projectVersion, setProjectVersion] = useState({
    id: "",
    chatId: "",
    versionNumber: "",
    snapshot: "",
  });

  // Message states for each section
  const [chatMessage, setChatMessage] = useState<Message | null>(null);
  const [fileMessage, setFileMessage] = useState<Message | null>(null);
  const [folderMessage, setFolderMessage] = useState<Message | null>(null);
  const [messageMessage, setMessageMessage] = useState<Message | null>(null);
  const [projectVersionMessage, setProjectVersionMessage] =
    useState<Message | null>(null);

  useEffect(() => {
    console.log(principal);
  }, [principal]);

  const handleResult = (
    res: any,
    setMessage: (msg: Message | null) => void
  ) => {
    // Custom replacer to handle BigInt serialization
    const replacer = (key: string, value: any) =>
      typeof value === "bigint" ? value.toString() : value;

    setMessage({
      type: "success",
      content: JSON.stringify(res, replacer, 2),
    });
  };

  const handleError = (
    error: any,
    setMessage: (msg: Message | null) => void
  ) => {
    console.error(error);
    setMessage({
      type: "error",
      content: `Error: ${error.message || error}`,
    });
  };

  const MessageDisplay = ({ message }: { message: Message | null }) => {
    if (!message) return null;

    return (
      <div
        className={`mt-3 p-3 rounded-lg border ${
          message.type === "success"
            ? "bg-green-900/20 border-green-700 text-green-300"
            : "bg-red-900/20 border-red-700 text-red-300"
        }`}
      >
        <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-32">
          {message.content}
        </pre>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">
              Authentication Required
            </CardTitle>
            <p className="text-sm text-gray-400">
              Please login to access the Chat System API test page
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={login} size="lg" className="w-full">
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Chat System API Test Console
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-gray-700 text-gray-300">
              Principal:
            </Badge>
            <code className="text-sm bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-600">
              {principal?.toString()}
            </code>
            <Button
              onClick={() => {
                if (principal) {
                  navigator.clipboard.writeText(principal.toString());
                }
              }}
              variant="outline"
              size="sm"
              className="ml-2 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Copy
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Chat Methods */}
          <Card className="h-fit bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                Chat Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create Chat */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Create New Chat
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="chat-title" className="text-gray-300">
                    Chat Title
                  </Label>
                  <Input
                    id="chat-title"
                    value={chat.title}
                    onChange={(e) => {
                      setChat((prev) => ({ ...prev, title: e.target.value }));
                      setChatMessage(null);
                    }}
                    placeholder="Enter chat title"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={async () => {
                      setChatMessage(null);
                      try {
                        const result = await handler.createChat(chat.title);
                        handleResult(result, setChatMessage);
                      } catch (error) {
                        handleError(error, setChatMessage);
                      }
                    }}
                    className="w-full"
                    disabled={!chat.title.trim()}
                  >
                    Create Chat
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Get Chat */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Get Chat by ID
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="chat-id" className="text-gray-300">
                    Chat ID
                  </Label>
                  <Input
                    id="chat-id"
                    value={chat.id}
                    onChange={(e) => {
                      setChat((prev) => ({ ...prev, id: e.target.value }));
                      setChatMessage(null);
                    }}
                    placeholder="Enter chat ID"
                    type="number"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={async () => {
                      setChatMessage(null);
                      try {
                        const result = await handler.getChat(Number(chat.id));
                        handleResult(result, setChatMessage);
                      } catch (error) {
                        handleError(error, setChatMessage);
                      }
                    }}
                    className="w-full"
                    disabled={!chat.id}
                  >
                    Get Chat
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Get All Chats by User */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Get All Chats by User
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="user-id" className="text-gray-300">
                    User Principal
                  </Label>
                  <Input
                    id="user-id"
                    value={chat.userId}
                    onChange={(e) => {
                      setChat((prev) => ({ ...prev, userId: e.target.value }));
                      setChatMessage(null);
                    }}
                    placeholder="Enter user principal"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={async () => {
                      setChatMessage(null);
                      try {
                        const result = await handler.getAllChatByUserId(
                          Principal.fromText(chat.userId)
                        );
                        handleResult(result, setChatMessage);
                      } catch (error) {
                        handleError(error, setChatMessage);
                      }
                    }}
                    className="w-full"
                    disabled={!chat.userId.trim()}
                  >
                    Get All Chats
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Update Chat */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Update Chat
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="update-chat-id" className="text-gray-300">
                      Chat ID
                    </Label>
                    <Input
                      id="update-chat-id"
                      value={chat.id}
                      onChange={(e) => {
                        setChat((prev) => ({ ...prev, id: e.target.value }));
                        setChatMessage(null);
                      }}
                      placeholder="Chat ID"
                      type="number"
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-title" className="text-gray-300">
                      New Title
                    </Label>
                    <Input
                      id="new-title"
                      value={chat.newTitle}
                      onChange={(e) => {
                        setChat((prev) => ({
                          ...prev,
                          newTitle: e.target.value,
                        }));
                        setChatMessage(null);
                      }}
                      placeholder="New title"
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <Button
                  onClick={async () => {
                    setChatMessage(null);
                    try {
                      const result = await handler.updateChat(
                        Number(chat.id),
                        chat.newTitle
                      );
                      handleResult(result, setChatMessage);
                    } catch (error) {
                      handleError(error, setChatMessage);
                    }
                  }}
                  className="w-full"
                  disabled={!chat.id || !chat.newTitle.trim()}
                >
                  Update Chat
                </Button>
              </div>

              <Separator />

              {/* Delete Chat */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Delete Chat
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="delete-chat-id" className="text-gray-300">
                    Chat ID
                  </Label>
                  <Input
                    id="delete-chat-id"
                    value={chat.id}
                    onChange={(e) => {
                      setChat((prev) => ({ ...prev, id: e.target.value }));
                      setChatMessage(null);
                    }}
                    placeholder="Enter chat ID to delete"
                    type="number"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={async () => {
                      setChatMessage(null);
                      try {
                        const result = await handler.deleteChat(
                          Number(chat.id)
                        );
                        handleResult(result, setChatMessage);
                      } catch (error) {
                        handleError(error, setChatMessage);
                      }
                    }}
                    variant="destructive"
                    className="w-full"
                    disabled={!chat.id}
                  >
                    Delete Chat
                  </Button>
                </div>
              </div>

              <MessageDisplay message={chatMessage} />
            </CardContent>
          </Card>

          {/* File Methods */}
          <Card className="h-fit bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                File Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create File */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Create New File
                </h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label
                        htmlFor="file-version-id"
                        className="text-gray-300"
                      >
                        Version ID
                      </Label>
                      <Input
                        id="file-version-id"
                        value={file.versionId}
                        onChange={(e) => {
                          setFile((prev) => ({
                            ...prev,
                            versionId: e.target.value,
                          }));
                          setFileMessage(null);
                        }}
                        placeholder="Version ID"
                        type="number"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="file-folder-id" className="text-gray-300">
                        Folder ID (Optional)
                      </Label>
                      <Input
                        id="file-folder-id"
                        value={file.folderId}
                        onChange={(e) => {
                          setFile((prev) => ({
                            ...prev,
                            folderId: e.target.value,
                          }));
                          setFileMessage(null);
                        }}
                        placeholder="Folder ID"
                        type="number"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="file-name" className="text-gray-300">
                      File Name
                    </Label>
                    <Input
                      id="file-name"
                      value={file.name}
                      onChange={(e) => {
                        setFile((prev) => ({ ...prev, name: e.target.value }));
                        setFileMessage(null);
                      }}
                      placeholder="Enter file name"
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="file-content" className="text-gray-300">
                      File Content
                    </Label>
                    <Textarea
                      id="file-content"
                      value={file.content}
                      onChange={(e) => {
                        setFile((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }));
                        setFileMessage(null);
                      }}
                      placeholder="Enter file content"
                      rows={3}
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      setFileMessage(null);
                      try {
                        const result = await handler.createFile(
                          Number(file.versionId),
                          Number(file.folderId) || 0,
                          file.name,
                          file.content
                        );
                        handleResult(result, setFileMessage);
                      } catch (error) {
                        handleError(error, setFileMessage);
                      }
                    }}
                    className="w-full"
                    disabled={!file.versionId || !file.name.trim()}
                  >
                    Create File
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Get File */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Get File by ID
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="get-file-id" className="text-gray-300">
                    File ID
                  </Label>
                  <Input
                    id="get-file-id"
                    value={file.id}
                    onChange={(e) => {
                      setFile((prev) => ({ ...prev, id: e.target.value }));
                      setFileMessage(null);
                    }}
                    placeholder="Enter file ID"
                    type="number"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={async () => {
                      setFileMessage(null);
                      try {
                        const result = await handler.getFile(Number(file.id));
                        handleResult(result, setFileMessage);
                      } catch (error) {
                        handleError(error, setFileMessage);
                      }
                    }}
                    className="w-full"
                    disabled={!file.id}
                  >
                    Get File
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Get All Files */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Get All Files by Version
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="files-version-id" className="text-gray-300">
                    Project Version ID
                  </Label>
                  <Input
                    id="files-version-id"
                    value={file.versionId}
                    onChange={(e) => {
                      setFile((prev) => ({
                        ...prev,
                        versionId: e.target.value,
                      }));
                      setFileMessage(null);
                    }}
                    placeholder="Enter version ID"
                    type="number"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={async () => {
                      setFileMessage(null);
                      try {
                        const result =
                          await handler.getAllFileByProjectVersionId(
                            Number(file.versionId)
                          );
                        handleResult(result, setFileMessage);
                      } catch (error) {
                        handleError(error, setFileMessage);
                      }
                    }}
                    className="w-full"
                    disabled={!file.versionId}
                  >
                    Get All Files
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Update File */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Update File
                </h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="update-file-id" className="text-gray-300">
                        File ID
                      </Label>
                      <Input
                        id="update-file-id"
                        value={file.id}
                        onChange={(e) => {
                          setFile((prev) => ({ ...prev, id: e.target.value }));
                          setFileMessage(null);
                        }}
                        placeholder="File ID"
                        type="number"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="update-folder-id"
                        className="text-gray-300"
                      >
                        New Folder ID
                      </Label>
                      <Input
                        id="update-folder-id"
                        value={file.newFolderId}
                        onChange={(e) => {
                          setFile((prev) => ({
                            ...prev,
                            newFolderId: e.target.value,
                          }));
                          setFileMessage(null);
                        }}
                        placeholder="New folder ID"
                        type="number"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="update-file-name" className="text-gray-300">
                      New File Name
                    </Label>
                    <Input
                      id="update-file-name"
                      value={file.newName}
                      onChange={(e) => {
                        setFile((prev) => ({
                          ...prev,
                          newName: e.target.value,
                        }));
                        setFileMessage(null);
                      }}
                      placeholder="New file name"
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="update-file-content"
                      className="text-gray-300"
                    >
                      New File Content
                    </Label>
                    <Textarea
                      id="update-file-content"
                      value={file.newContent}
                      onChange={(e) => {
                        setFile((prev) => ({
                          ...prev,
                          newContent: e.target.value,
                        }));
                        setFileMessage(null);
                      }}
                      placeholder="New file content"
                      rows={3}
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      setFileMessage(null);
                      try {
                        const result = await handler.updateFile(
                          Number(file.id),
                          Number(file.newFolderId) || undefined,
                          file.newName || undefined,
                          file.newContent || undefined
                        );
                        handleResult(result, setFileMessage);
                      } catch (error) {
                        handleError(error, setFileMessage);
                      }
                    }}
                    className="w-full"
                    disabled={!file.id}
                  >
                    Update File
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Delete File */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Delete File
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="delete-file-id" className="text-gray-300">
                    File ID
                  </Label>
                  <Input
                    id="delete-file-id"
                    value={file.id}
                    onChange={(e) => {
                      setFile((prev) => ({ ...prev, id: e.target.value }));
                      setFileMessage(null);
                    }}
                    placeholder="Enter file ID to delete"
                    type="number"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={async () => {
                      setFileMessage(null);
                      try {
                        const result = await handler.deleteFile(
                          Number(file.id)
                        );
                        handleResult(result, setFileMessage);
                      } catch (error) {
                        handleError(error, setFileMessage);
                      }
                    }}
                    variant="destructive"
                    className="w-full"
                    disabled={!file.id}
                  >
                    Delete File
                  </Button>
                </div>
              </div>

              <MessageDisplay message={fileMessage} />
            </CardContent>
          </Card>

          {/* Folder Methods */}
          <Card className="h-fit bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                Folder Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create Folder */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Create New Folder
                </h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label
                        htmlFor="folder-version-id"
                        className="text-gray-300"
                      >
                        Version ID
                      </Label>
                      <Input
                        id="folder-version-id"
                        value={folder.versionId}
                        onChange={(e) => {
                          setFolder((prev) => ({
                            ...prev,
                            versionId: e.target.value,
                          }));
                          setFolderMessage(null);
                        }}
                        placeholder="Version ID"
                        type="number"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="folder-parent-id"
                        className="text-gray-300"
                      >
                        Parent Folder ID
                      </Label>
                      <Input
                        id="folder-parent-id"
                        value={folder.parentId}
                        onChange={(e) => {
                          setFolder((prev) => ({
                            ...prev,
                            parentId: e.target.value,
                          }));
                          setFolderMessage(null);
                        }}
                        placeholder="Parent ID (optional)"
                        type="number"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="folder-name" className="text-gray-300">
                      Folder Name
                    </Label>
                    <Input
                      id="folder-name"
                      value={folder.name}
                      onChange={(e) => {
                        setFolder((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }));
                        setFolderMessage(null);
                      }}
                      placeholder="Enter folder name"
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      setFolderMessage(null);
                      try {
                        const result = await handler.createFolder(
                          Number(folder.versionId),
                          folder.name,
                          Number(folder.parentId) || undefined
                        );
                        handleResult(result, setFolderMessage);
                      } catch (error) {
                        handleError(error, setFolderMessage);
                      }
                    }}
                    className="w-full"
                    disabled={!folder.versionId || !folder.name.trim()}
                  >
                    Create Folder
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Get Folder */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Get Folder by ID
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="get-folder-id" className="text-gray-300">
                    Folder ID
                  </Label>
                  <Input
                    id="get-folder-id"
                    value={folder.id}
                    onChange={(e) => {
                      setFolder((prev) => ({ ...prev, id: e.target.value }));
                      setFolderMessage(null);
                    }}
                    placeholder="Enter folder ID"
                    type="number"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={async () => {
                      setFolderMessage(null);
                      try {
                        const result = await handler.getFolder(
                          Number(folder.id)
                        );
                        handleResult(result, setFolderMessage);
                      } catch (error) {
                        handleError(error, setFolderMessage);
                      }
                    }}
                    className="w-full"
                    disabled={!folder.id}
                  >
                    Get Folder
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Get All Folders */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Get All Folders by Version
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="folders-version-id" className="text-gray-300">
                    Project Version ID
                  </Label>
                  <Input
                    id="folders-version-id"
                    value={folder.versionId}
                    onChange={(e) => {
                      setFolder((prev) => ({
                        ...prev,
                        versionId: e.target.value,
                      }));
                      setFolderMessage(null);
                    }}
                    placeholder="Enter version ID"
                    type="number"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={async () => {
                      setFolderMessage(null);
                      try {
                        const result =
                          await handler.getAllFolderByProjectVersionId(
                            Number(folder.versionId)
                          );
                        handleResult(result, setFolderMessage);
                      } catch (error) {
                        handleError(error, setFolderMessage);
                      }
                    }}
                    className="w-full"
                    disabled={!folder.versionId}
                  >
                    Get All Folders
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Update Folder */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Update Folder
                </h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label
                        htmlFor="update-folder-id"
                        className="text-gray-300"
                      >
                        Folder ID
                      </Label>
                      <Input
                        id="update-folder-id"
                        value={folder.id}
                        onChange={(e) => {
                          setFolder((prev) => ({
                            ...prev,
                            id: e.target.value,
                          }));
                          setFolderMessage(null);
                        }}
                        placeholder="Folder ID"
                        type="number"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="update-parent-id"
                        className="text-gray-300"
                      >
                        New Parent ID
                      </Label>
                      <Input
                        id="update-parent-id"
                        value={folder.newParentId}
                        onChange={(e) => {
                          setFolder((prev) => ({
                            ...prev,
                            newParentId: e.target.value,
                          }));
                          setFolderMessage(null);
                        }}
                        placeholder="New parent ID"
                        type="number"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      htmlFor="update-folder-name"
                      className="text-gray-300"
                    >
                      New Folder Name
                    </Label>
                    <Input
                      id="update-folder-name"
                      value={folder.newName}
                      onChange={(e) => {
                        setFolder((prev) => ({
                          ...prev,
                          newName: e.target.value,
                        }));
                        setFolderMessage(null);
                      }}
                      placeholder="New folder name"
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      setFolderMessage(null);
                      try {
                        const result = await handler.updateFolder(
                          Number(folder.id),
                          folder.newName || undefined,
                          Number(folder.newParentId) || undefined
                        );
                        handleResult(result, setFolderMessage);
                      } catch (error) {
                        handleError(error, setFolderMessage);
                      }
                    }}
                    className="w-full"
                    disabled={!folder.id}
                  >
                    Update Folder
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Delete Folder */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Delete Folder
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="delete-folder-id" className="text-gray-300">
                    Folder ID
                  </Label>
                  <Input
                    id="delete-folder-id"
                    value={folder.id}
                    onChange={(e) => {
                      setFolder((prev) => ({ ...prev, id: e.target.value }));
                      setFolderMessage(null);
                    }}
                    placeholder="Enter folder ID to delete"
                    type="number"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={async () => {
                      setFolderMessage(null);
                      try {
                        const result = await handler.deleteFolder(
                          Number(folder.id)
                        );
                        handleResult(result, setFolderMessage);
                      } catch (error) {
                        handleError(error, setFolderMessage);
                      }
                    }}
                    variant="destructive"
                    className="w-full"
                    disabled={!folder.id}
                  >
                    Delete Folder
                  </Button>
                </div>
              </div>

              <MessageDisplay message={folderMessage} />
            </CardContent>
          </Card>

          {/* Message Methods */}
          <Card className="h-fit bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                Message Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create Message */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Create New Message
                </h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label
                        htmlFor="message-chat-id"
                        className="text-gray-300"
                      >
                        Chat ID
                      </Label>
                      <Input
                        id="message-chat-id"
                        value={message.chatId}
                        onChange={(e) => {
                          setMessage((prev) => ({
                            ...prev,
                            chatId: e.target.value,
                          }));
                          setMessageMessage(null);
                        }}
                        placeholder="Chat ID"
                        type="number"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="message-ref-version"
                        className="text-gray-300"
                      >
                        Referenced Version
                      </Label>
                      <Input
                        id="message-ref-version"
                        value={message.referencedVersion}
                        onChange={(e) => {
                          setMessage((prev) => ({
                            ...prev,
                            referencedVersion: e.target.value,
                          }));
                          setMessageMessage(null);
                        }}
                        placeholder="Version ID (optional)"
                        type="number"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="message-content" className="text-gray-300">
                      Message Content
                    </Label>
                    <Textarea
                      id="message-content"
                      value={message.content}
                      onChange={(e) => {
                        setMessage((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }));
                        setMessageMessage(null);
                      }}
                      placeholder="Enter message content"
                      rows={3}
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        setMessageMessage(null);
                        try {
                          const result = await handler.createMessage(
                            Number(message.chatId),
                            { user: null },
                            message.content,
                            Number(message.referencedVersion) || undefined
                          );
                          handleResult(result, setMessageMessage);
                        } catch (error) {
                          handleError(error, setMessageMessage);
                        }
                      }}
                      className="flex-1"
                      disabled={!message.chatId || !message.content.trim()}
                    >
                      Create User Message
                    </Button>
                    <Button
                      onClick={async () => {
                        setMessageMessage(null);
                        try {
                          const result = await handler.createMessage(
                            Number(message.chatId),
                            { ai: null },
                            message.content,
                            Number(message.referencedVersion) || undefined
                          );
                          handleResult(result, setMessageMessage);
                        } catch (error) {
                          handleError(error, setMessageMessage);
                        }
                      }}
                      variant="secondary"
                      className="flex-1"
                      disabled={!message.chatId || !message.content.trim()}
                    >
                      Create AI Message
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Get Message */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Get Message by ID
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="get-message-id" className="text-gray-300">
                    Message ID
                  </Label>
                  <Input
                    id="get-message-id"
                    value={message.id}
                    onChange={(e) => {
                      setMessage((prev) => ({ ...prev, id: e.target.value }));
                      setMessageMessage(null);
                    }}
                    placeholder="Enter message ID"
                    type="number"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={async () => {
                      setMessageMessage(null);
                      try {
                        const result = await handler.getMessage(
                          Number(message.id)
                        );
                        handleResult(result, setMessageMessage);
                      } catch (error) {
                        handleError(error, setMessageMessage);
                      }
                    }}
                    className="w-full"
                    disabled={!message.id}
                  >
                    Get Message
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Get All Messages */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Get All Messages by Chat
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="messages-chat-id" className="text-gray-300">
                    Chat ID
                  </Label>
                  <Input
                    id="messages-chat-id"
                    value={message.chatId}
                    onChange={(e) => {
                      setMessage((prev) => ({
                        ...prev,
                        chatId: e.target.value,
                      }));
                      setMessageMessage(null);
                    }}
                    placeholder="Enter chat ID"
                    type="number"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={async () => {
                      setMessageMessage(null);
                      try {
                        const result = await handler.getAllMessageByChatId(
                          Number(message.chatId)
                        );
                        handleResult(result, setMessageMessage);
                      } catch (error) {
                        handleError(error, setMessageMessage);
                      }
                    }}
                    className="w-full"
                    disabled={!message.chatId}
                  >
                    Get All Messages
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Update Message */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Update Message
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="update-message-id" className="text-gray-300">
                    Message ID
                  </Label>
                  <Input
                    id="update-message-id"
                    value={message.id}
                    onChange={(e) => {
                      setMessage((prev) => ({ ...prev, id: e.target.value }));
                      setMessageMessage(null);
                    }}
                    placeholder="Message ID"
                    type="number"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Label
                    htmlFor="update-message-content"
                    className="text-gray-300"
                  >
                    New Content
                  </Label>
                  <Textarea
                    id="update-message-content"
                    value={message.newContent}
                    onChange={(e) => {
                      setMessage((prev) => ({
                        ...prev,
                        newContent: e.target.value,
                      }));
                      setMessageMessage(null);
                    }}
                    placeholder="New message content"
                    rows={3}
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={async () => {
                      setMessageMessage(null);
                      try {
                        const result = await handler.updateMessage(
                          Number(message.id),
                          message.newContent || undefined
                        );
                        handleResult(result, setMessageMessage);
                      } catch (error) {
                        handleError(error, setMessageMessage);
                      }
                    }}
                    className="w-full"
                    disabled={!message.id || !message.newContent.trim()}
                  >
                    Update Message
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Delete Message */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Delete Message
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="delete-message-id" className="text-gray-300">
                    Message ID
                  </Label>
                  <Input
                    id="delete-message-id"
                    value={message.id}
                    onChange={(e) => {
                      setMessage((prev) => ({ ...prev, id: e.target.value }));
                      setMessageMessage(null);
                    }}
                    placeholder="Enter message ID to delete"
                    type="number"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={async () => {
                      setMessageMessage(null);
                      try {
                        const result = await handler.deleteMessage(
                          Number(message.id)
                        );
                        handleResult(result, setMessageMessage);
                      } catch (error) {
                        handleError(error, setMessageMessage);
                      }
                    }}
                    variant="destructive"
                    className="w-full"
                    disabled={!message.id}
                  >
                    Delete Message
                  </Button>
                </div>
              </div>

              <MessageDisplay message={messageMessage} />
            </CardContent>
          </Card>

          {/* Project Version Methods */}
          <Card className="h-fit bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                Project Version Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create Project Version */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Create Project Version
                </h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="pv-chat-id" className="text-gray-300">
                        Chat ID
                      </Label>
                      <Input
                        id="pv-chat-id"
                        value={projectVersion.chatId}
                        onChange={(e) => {
                          setProjectVersion((prev) => ({
                            ...prev,
                            chatId: e.target.value,
                          }));
                          setProjectVersionMessage(null);
                        }}
                        placeholder="Chat ID"
                        type="number"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="pv-version-number"
                        className="text-gray-300"
                      >
                        Version Number
                      </Label>
                      <Input
                        id="pv-version-number"
                        value={projectVersion.versionNumber}
                        onChange={(e) => {
                          setProjectVersion((prev) => ({
                            ...prev,
                            versionNumber: e.target.value,
                          }));
                          setProjectVersionMessage(null);
                        }}
                        placeholder="Version number"
                        type="number"
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="pv-snapshot" className="text-gray-300">
                      Snapshot Content
                    </Label>
                    <Textarea
                      id="pv-snapshot"
                      value={projectVersion.snapshot}
                      onChange={(e) => {
                        setProjectVersion((prev) => ({
                          ...prev,
                          snapshot: e.target.value,
                        }));
                        setProjectVersionMessage(null);
                      }}
                      placeholder="Enter snapshot content"
                      rows={4}
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      setProjectVersionMessage(null);
                      try {
                        const result = await handler.createProjectVersion(
                          Number(projectVersion.chatId),
                          Number(projectVersion.versionNumber),
                          projectVersion.snapshot
                        );
                        handleResult(result, setProjectVersionMessage);
                      } catch (error) {
                        handleError(error, setProjectVersionMessage);
                      }
                    }}
                    className="w-full"
                    disabled={
                      !projectVersion.chatId || !projectVersion.versionNumber
                    }
                  >
                    Create Project Version
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Get Project Version */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Get Project Version by ID
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="get-pv-id" className="text-gray-300">
                    Version ID
                  </Label>
                  <Input
                    id="get-pv-id"
                    value={projectVersion.id}
                    onChange={(e) => {
                      setProjectVersion((prev) => ({
                        ...prev,
                        id: e.target.value,
                      }));
                      setProjectVersionMessage(null);
                    }}
                    placeholder="Enter version ID"
                    type="number"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={async () => {
                      setProjectVersionMessage(null);
                      try {
                        const result = await handler.getProjectVersion(
                          Number(projectVersion.id)
                        );
                        handleResult(result, setProjectVersionMessage);
                      } catch (error) {
                        handleError(error, setProjectVersionMessage);
                      }
                    }}
                    className="w-full"
                    disabled={!projectVersion.id}
                  >
                    Get Project Version
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Get All Project Versions */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-300">
                  Get All Project Versions by Chat
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="pvs-chat-id" className="text-gray-300">
                    Chat ID
                  </Label>
                  <Input
                    id="pvs-chat-id"
                    value={projectVersion.chatId}
                    onChange={(e) => {
                      setProjectVersion((prev) => ({
                        ...prev,
                        chatId: e.target.value,
                      }));
                      setProjectVersionMessage(null);
                    }}
                    placeholder="Enter chat ID"
                    type="number"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={async () => {
                      setProjectVersionMessage(null);
                      try {
                        const result =
                          await handler.getAllProjectVersionByChatId(
                            Number(projectVersion.chatId)
                          );
                        handleResult(result, setProjectVersionMessage);
                      } catch (error) {
                        handleError(error, setProjectVersionMessage);
                      }
                    }}
                    className="w-full"
                    disabled={!projectVersion.chatId}
                  >
                    Get All Project Versions
                  </Button>
                </div>
              </div>

              <MessageDisplay message={projectVersionMessage} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
