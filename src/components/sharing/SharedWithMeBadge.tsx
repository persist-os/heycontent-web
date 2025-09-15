'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SharedWithMeBadgeProps {
  ownerName: string;
  ownerEmail?: string;
  ownerAvatar?: string;
  sharedAt?: number;
  className?: string;
  size?: 'sm' | 'default';
  showAvatar?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
}

export const SharedWithMeBadge: React.FC<SharedWithMeBadgeProps> = ({
  ownerName,
  ownerEmail,
  ownerAvatar,
  sharedAt,
  className,
  size = 'default',
  showAvatar = true,
  variant = 'outline'
}) => {
  const formatSharedTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDisplayText = () => {
    const baseText = `Shared by ${ownerName}`;
    if (sharedAt) {
      return `${baseText} • ${formatSharedTime(sharedAt)}`;
    }
    return baseText;
  };

  const getBadgeColor = () => {
    if (variant === 'default') {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
    }
    return '';
  };

  return (
    <Badge 
      variant={variant}
      className={cn(
        "flex items-center gap-1.5",
        size === 'sm' && "px-2 py-1 text-xs",
        variant === 'default' && getBadgeColor(),
        className
      )}
      title={ownerEmail ? `${ownerName} (${ownerEmail})` : ownerName}
    >
      {showAvatar ? (
        <Avatar className={cn("w-4 h-4", size === 'sm' && "w-3 h-3")}>
          <AvatarImage src={ownerAvatar} />
          <AvatarFallback className="text-xs">
            {ownerName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : (
        <UserCheck className={cn("w-3 h-3", size === 'sm' && "w-2.5 h-2.5")} />
      )}
      <span className="truncate max-w-[200px]">
        {getDisplayText()}
      </span>
    </Badge>
  );
};
