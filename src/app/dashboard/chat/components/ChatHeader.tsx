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
    <div className="flex items-center justify-between px-4 py-2 bg-background border-b border-border">
      {/* Left side - placeholder for future content */}
      <div className="flex-1">
        {rightContent}
      </div>
      
      {/* Center - Title */}
      <div className="flex-1 flex justify-center">
        <h1 className="text-lg font-semibold text-foreground">
          Chat With Content
        </h1>
      </div>
      
      {/* Right side - New Chat Button */}
      <div className="flex-1 flex justify-end">
        <button
          onClick={onNewChat}
          disabled={isRefreshing || !isAuthenticated}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200
            text-muted-foreground hover:text-foreground
            hover:bg-secondary border border-border
            hover:border-primary/20 text-sm font-medium
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