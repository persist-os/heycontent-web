import React from 'react';
import { MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { HelpIconButton } from '@/components/ui/help-icon-button';
import { EnhancedHelpButton } from '@/components/ui/enhanced-help-button';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();
  
  return (
    <div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-3 relative">
        {/* Center - Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-lg font-semibold text-foreground">Chat</h1>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 ml-auto">
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
          
          {/* Self tab - positioned after theme toggle */}
          <Link
            href="/dashboard/self-hub"
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm ${
              pathname.startsWith('/dashboard/self-hub')
                ? 'bg-primary text-primary-foreground'
                : 'bg-background/80 hover:bg-background text-foreground border border-border'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Self</span>
          </Link>
          
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