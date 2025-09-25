'use client';

import React, { useState } from 'react';
import { usePresenceStore, UserPresence } from '@/store/presence-store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Users, Eye, Edit, Clock } from 'lucide-react';

interface CollaboratorPanelProps {
  className?: string;
  showInHeader?: boolean;
}

function UserStatusIndicator({ user }: { user: UserPresence }) {
  const now = Date.now();
  const timeSinceLastSeen = now - user.lastSeen;
  
  let status: 'online' | 'typing' | 'idle';
  let statusColor: string;
  
  if (user.isTyping) {
    status = 'typing';
    statusColor = 'bg-blue-500';
  } else if (timeSinceLastSeen < 5000) { // Active within 5 seconds
    status = 'online';
    statusColor = 'bg-green-500';
  } else {
    status = 'idle';
    statusColor = 'bg-gray-400';
  }
  
  return (
    <div className="relative">
      <div 
        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${statusColor}`}
      >
        {status === 'typing' && (
          <div className={`w-full h-full rounded-full ${statusColor} animate-pulse`} />
        )}
      </div>
    </div>
  );
}

function UserAvatar({ user, size = 'sm' }: { user: UserPresence; size?: 'xs' | 'sm' | 'md' }) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
  };
  
  const initials = user.userName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  return (
    <div className="relative">
      <Avatar className={sizeClasses[size]}>
        <AvatarFallback 
          style={{ backgroundColor: `${user.userColor}20`, color: user.userColor }}
          className="font-medium"
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <UserStatusIndicator user={user} />
    </div>
  );
}

function CollaboratorList({ users }: { users: UserPresence[] }) {
  const formatLastSeen = (lastSeen: number) => {
    const now = Date.now();
    const diff = now - lastSeen;
    
    if (diff < 1000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Active Collaborators</h3>
        <Badge variant="secondary" className="text-xs">
          {users.length} online
        </Badge>
      </div>
      
      <div className="space-y-2">
        {users.map(user => (
          <div key={user.userId} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <UserAvatar user={user} size="md" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm truncate">
                  {user.userName}
                </span>
                {user.isTyping && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    <Edit className="w-3 h-3 mr-1" />
                    Typing
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                <Clock className="w-3 h-3" />
                <span>{formatLastSeen(user.lastSeen)}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              {user.selectionRange && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs">
                      <Eye className="w-3 h-3" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Has text selected</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CollaboratorPanel({ className = '', showInHeader = false }: CollaboratorPanelProps) {
  const { activeUsers, currentUser, getActiveUserCount } = usePresenceStore();
  const [isOpen, setIsOpen] = useState(false);
  
  // Filter out current user
  const otherUsers = Array.from(activeUsers.values()).filter(
    user => !currentUser || user.userId !== currentUser.userId
  );
  
  const activeCount = otherUsers.length;
  
  if (showInHeader) {
    // Compact header version
    if (activeCount === 0) {
      return null;
    }
    
    return (
      <TooltipProvider>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className={`h-8 px-2 ${className}`}>
              <div className="flex items-center space-x-1">
                <div className="flex -space-x-1">
                  {otherUsers.slice(0, 3).map(user => (
                    <UserAvatar key={user.userId} user={user} size="xs" />
                  ))}
                </div>
                {activeCount > 3 && (
                  <Badge variant="secondary" className="text-xs ml-1">
                    +{activeCount - 3}
                  </Badge>
                )}
              </div>
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-80 p-4" align="end">
            <CollaboratorList users={otherUsers} />
          </PopoverContent>
        </Popover>
      </TooltipProvider>
    );
  }
  
  // Full panel version
  return (
    <TooltipProvider>
      <div className={`bg-background border rounded-lg shadow-sm ${className}`}>
        <div className="p-4">
          {activeCount === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No other collaborators online</p>
            </div>
          ) : (
            <CollaboratorList users={otherUsers} />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// Floating collaborator indicator for minimal UI
export function FloatingCollaboratorIndicator({ className = '' }: { className?: string }) {
  const { activeUsers, currentUser } = usePresenceStore();
  
  const otherUsers = Array.from(activeUsers.values()).filter(
    user => !currentUser || user.userId !== currentUser.userId
  );
  
  if (otherUsers.length === 0) {
    return null;
  }
  
  return (
    <TooltipProvider>
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              size="sm" 
              className="rounded-full shadow-lg bg-background border hover:bg-muted"
              variant="outline"
            >
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-1">
                  {otherUsers.slice(0, 2).map(user => (
                    <UserAvatar key={user.userId} user={user} size="xs" />
                  ))}
                </div>
                <span className="text-xs font-medium">
                  {otherUsers.length} online
                </span>
              </div>
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-80 p-4" align="end" side="top">
            <CollaboratorList users={otherUsers} />
          </PopoverContent>
        </Popover>
      </div>
    </TooltipProvider>
  );
}
