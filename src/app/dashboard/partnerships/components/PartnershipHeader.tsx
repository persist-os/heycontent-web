'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Partnership } from '../types';

// Constants
const AVATAR_MAX_CHARS = 4;

interface PartnershipHeaderProps {
  readonly partnership: Partnership;
  readonly onDelete: () => void;
  readonly deleteLoading: boolean;
  readonly themeColor?: string;
}

export function PartnershipHeader({
  partnership,
  onDelete,
  deleteLoading,
  themeColor = 'blue'
}: PartnershipHeaderProps) {
  // Get theme color - simplified
  const getThemeColor = (color: string): string => {
    const colors = {
      purple: '#9D89F7',    // Partnership
      pink: '#FF96FB',      // Media
      teal: '#40E3FF',      // Business  
      green: '#9BE7B2',     // Community
      yellow: '#FFDF39'     // Default/Uncategorized - HeyContent Yellow
    };
    return colors[color as keyof typeof colors] || colors.yellow;
  };

  const themeColorHex = getThemeColor(themeColor);
  const isYellow = themeColor === 'yellow';

  return (
    <div className="space-y-3">
      {/* Title and Action Icons */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            Partnership Opportunity with {partnership.brandName}
          </h2>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={deleteLoading}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Company Info */}
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full ${
          isYellow 
            ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' 
            : `bg-[${themeColorHex}]`
        } flex items-center justify-center text-white text-xs font-bold`}>
          {partnership.brandName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, AVATAR_MAX_CHARS)}
        </div>
        <div className="text-sm text-muted-foreground">
          From: {partnership.brandName}
        </div>
      </div>
    </div>
  );
}
