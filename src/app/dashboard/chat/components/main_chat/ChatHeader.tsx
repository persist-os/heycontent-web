import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { HelpIconButton } from '@/components/ui/help-icon-button';
import { EnhancedHelpButton } from '@/components/ui/enhanced-help-button';
import { ThemeToggle } from '@/components/theme-toggle';

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
  return (
    <div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Logo */}
        <div className="flex items-center gap-2 ml-12 md:ml-0">
          <Logo disableLink />
          <h1 className="text-lg font-semibold text-foreground">Chat</h1>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {onNewChat && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNewChat}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </Button>
          )}
          
          <ThemeToggle />
          
          {onInteractiveTour ? (
            <EnhancedHelpButton onInteractiveTour={onInteractiveTour} />
          ) : (
            onShowHelp && <HelpIconButton onClick={onShowHelp} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader; 