'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Partnership } from '../types';

interface PartnershipControlBarProps {
  readonly partnership: Partnership;
  readonly onCategoryChange: (category: Partnership['category']) => void;
  readonly onStatusChange: (status: Partnership['status']) => void;
  readonly themeColor?: string;
}

export function PartnershipControlBar({
  partnership,
  onCategoryChange,
  onStatusChange,
  themeColor = 'blue'
}: PartnershipControlBarProps) {
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
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        {/* Type Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Type:</span>
          <Select value={partnership.category || 'partnership'} onValueChange={onCategoryChange}>
            <SelectTrigger className={`w-32 h-8 ${
              isYellow 
                ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                : `bg-[${themeColorHex}]/[0.11] dark:bg-[${themeColorHex}]/[0.08] border-[${themeColorHex}]/20 dark:border-[${themeColorHex}]/30 hover:bg-[${themeColorHex}]/[0.15] dark:hover:bg-[${themeColorHex}]/[0.12]`
            } text-foreground`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="partnership">Partnership</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="community">Community</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select value={partnership.status} onValueChange={onStatusChange}>
            <SelectTrigger className={`w-32 h-8 ${
              isYellow 
                ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                : `bg-[${themeColorHex}]/[0.11] dark:bg-[${themeColorHex}]/[0.08] border-[${themeColorHex}]/20 dark:border-[${themeColorHex}]/30 hover:bg-[${themeColorHex}]/[0.15] dark:hover:bg-[${themeColorHex}]/[0.12]`
            } text-foreground`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opportunity">Opportunity</SelectItem>
              <SelectItem value="inquiry">Inquiry</SelectItem>
              <SelectItem value="negotiating">Negotiating</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto-track Checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox id="auto-track" className={
            isYellow 
              ? 'border-yellow-300 dark:border-yellow-700'
              : `border-[${themeColorHex}]/30 dark:border-[${themeColorHex}]/50`
          } />
          <label htmlFor="auto-track" className="text-sm text-muted-foreground">
            Auto-track this partnership status
          </label>
        </div>
      </div>
    </div>
  );
}
