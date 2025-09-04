import React from 'react';
import { CentralizedHeader, createNewChatAction } from '@/components/ui/centralized-header';

interface ChatHeaderProps {
  onNewChat?: () => void;
  onShowHelp?: () => void;
  onInteractiveTour?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  onNewChat, 
  onShowHelp,
  onInteractiveTour
}) => {
  // Create actions
  const rightActions = onNewChat ? [createNewChatAction(onNewChat)] : [];

  return (
    <CentralizedHeader
      title="Chat"
      rightActions={rightActions}
      showThemeToggle={true}
      showSelfTab={true}
      showHelp={true}
      onShowHelp={onShowHelp}
      onInteractiveTour={onInteractiveTour}
      variant="elevated"
    />
  );
};

export default ChatHeader; 