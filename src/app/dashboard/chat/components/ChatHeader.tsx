import React from 'react';
import { RefreshCw } from 'lucide-react';

interface ChatHeaderProps {
  isRefreshing: boolean;
  onNewChat: () => void;
  rightContent?: React.ReactNode;
}

export default function ChatHeader({ 
  isRefreshing, 
  onNewChat,
  rightContent
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-end px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800">
      {rightContent}
      <button
        onClick={onNewChat}
        disabled={isRefreshing}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200
          text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
          hover:bg-gray-100 dark:hover:bg-gray-700
          ${isRefreshing ? 'animate-spin' : ''}`}
        aria-label="New chat"
        title="New chat"
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
} 