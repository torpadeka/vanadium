import React from "react";
import { X, Plus, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Chat {
    id: string;
    name: string;
    lastMessage?: string;
    timestamp: Date;
}

interface ChatSidebarProps {
    chats: Chat[];
    currentChat: string;
    onSelectChat: (chatId: string) => void;
    onClose: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
    chats,
    currentChat,
    onSelectChat,
    onClose,
}) => {
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

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full w-80 bg-gray-900 border-r border-gray-800 z-50 flex flex-col shadow-2xl">
                {/* Header */}
                <div className="border-b border-gray-800 p-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">
                        Projects
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* New Chat Button */}
                <div className="p-4 border-b border-gray-800">
                    <Button className="w-full" size="lg">
                        <Plus className="w-4 h-4 mr-2" />
                        New Project
                    </Button>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                    {chats.map((chat) => (
                        <button
                            key={chat.id}
                            onClick={() => {
                                onSelectChat(chat.id);
                                onClose();
                            }}
                            className={`w-full text-left p-4 border-b border-gray-800 hover:bg-gray-800 transition-colors ${
                                currentChat === chat.id
                                    ? "bg-gray-800 border-l-4 border-l-purple-glow"
                                    : ""
                            }`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-1">
                                    <MessageSquare className="w-4 h-4 text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-white truncate">
                                        {chat.name}
                                    </h3>
                                    {chat.lastMessage && (
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                            {chat.lastMessage}
                                        </p>
                                    )}
                                    <div className="flex items-center mt-2 text-xs text-gray-500">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {formatTimestamp(chat.timestamp)}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-800 p-4">
                    <p className="text-xs text-gray-500 text-center">
                        {chats.length} project{chats.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>
        </>
    );
};

export default ChatSidebar;
