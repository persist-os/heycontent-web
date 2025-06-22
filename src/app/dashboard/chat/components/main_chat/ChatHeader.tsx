import React from 'react';
import { MessageSquarePlus } from 'lucide-react';

interface ChatHeaderProps {
  isRefreshing: boolean;
  onNewChat: () => void;
  rightContent?: React.ReactNode;
  isAuthenticated?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  isRefreshing,
  onNewChat,
  rightContent,
  isAuthenticated,
}) => {
  return (
    <div className="flex h-16 shrink-0 items-center border-b px-4">
      <div className="flex flex-1 items-center justify-start">
        {/* Left-aligned content can go here if needed */}
      </div>
      <div className="flex-1 text-center">
        <h1 className="text-lg font-semibold tracking-tight">Chat</h1>
      </div>
      <div className="flex flex-1 items-center justify-end gap-2">
        {rightContent}
        {isAuthenticated && (
          <button
            onClick={onNewChat}
            disabled={isRefreshing}
            className="flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
            aria-label="New Chat"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader; 