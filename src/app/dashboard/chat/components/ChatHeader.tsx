import React from 'react';
import { MessageSquarePlus } from 'lucide-react';

interface ChatHeaderProps {
  isRefreshing: boolean;
  onNewChat: () => void;
  rightContent?: React.ReactNode;
  isAuthenticated?: boolean;
}

export default function ChatHeader({ 
  isRefreshing, 
  onNewChat,
  rightContent,
  isAuthenticated = true
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800">
      {/* Left side - placeholder for future content */}
      <div className="flex-1">
        {rightContent}
      </div>
      
      {/* Center - Title */}
      <div className="flex-1 flex justify-center">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Chat With Content
        </h1>
      </div>
      
      {/* Right side - New Chat Button */}
      <div className="flex-1 flex justify-end">
        <button
          onClick={onNewChat}
          disabled={isRefreshing || !isAuthenticated}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200
            text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100
            hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600
            hover:border-gray-300 dark:hover:border-gray-500 text-sm font-medium
            ${(isRefreshing || !isAuthenticated) ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label="New conversation"
          title="Start new conversation"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>
    </div>
  );
} 