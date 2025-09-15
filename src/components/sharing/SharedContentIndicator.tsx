'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, Lock, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SharedContentIndicatorProps {
  sharedCount: number;
  hasEditPermissions?: boolean;
  className?: string;
  size?: 'sm' | 'default';
  variant?: 'default' | 'outline' | 'secondary';
}

export const SharedContentIndicator: React.FC<SharedContentIndicatorProps> = ({
  sharedCount,
  hasEditPermissions = false,
  className,
  size = 'default',
  variant = 'outline'
}) => {
  if (sharedCount === 0) return null;

  const getIcon = () => {
    if (hasEditPermissions) {
      return <Edit3 className={cn("w-3 h-3", size === 'sm' && "w-2.5 h-2.5")} />;
    }
    return <Users className={cn("w-3 h-3", size === 'sm' && "w-2.5 h-2.5")} />;
  };

  const getText = () => {
    if (sharedCount === 1) {
      return hasEditPermissions ? '1 editor' : '1 viewer';
    }
    return hasEditPermissions ? `${sharedCount} editors` : `${sharedCount} shared`;
  };

  const getBadgeColor = () => {
    if (variant === 'default') {
      return hasEditPermissions 
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    }
    return '';
  };

  return (
    <Badge 
      variant={variant}
      className={cn(
        "flex items-center gap-1",
        size === 'sm' && "px-1.5 py-0.5 text-xs",
        variant === 'default' && getBadgeColor(),
        className
      )}
    >
      {getIcon()}
      <span>{getText()}</span>
    </Badge>
  );
};
