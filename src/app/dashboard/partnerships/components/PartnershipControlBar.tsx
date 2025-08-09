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

  // Map themeColor to static Tailwind classes
  const themeColorClasses: Record<string, string> = {
    purple: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/50 hover:bg-purple-100 dark:hover:bg-purple-900/30',
    pink: 'bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800/50 hover:bg-pink-100 dark:hover:bg-pink-900/30',
    teal: 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/30',
    green: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-900/30',
    yellow: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
  };

  // Checkbox classes - commented out until auto-track functionality is implemented
  /*
  const checkboxClasses: Record<string, string> = {
    purple: 'border-purple-300 dark:border-purple-700',
    pink: 'border-pink-300 dark:border-pink-700',
    teal: 'border-cyan-300 dark:border-cyan-700',
    green: 'border-green-300 dark:border-green-700',
    yellow: 'border-yellow-300 dark:border-yellow-700',
  };
  const checkboxClassName = checkboxClasses[themeColor] || checkboxClasses.yellow;
  */

  const selectClassName = `w-32 h-8 ${themeColorClasses[themeColor] || themeColorClasses.yellow} text-foreground`;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        {/* Type Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Type:</span>
          <Select value={partnership.category || 'partnership'} onValueChange={onCategoryChange}>
            <SelectTrigger className={selectClassName}>
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
            <SelectTrigger className={selectClassName}>
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

        {/* Auto-track Checkbox - Commented out until functionality is implemented */}
        {/* 
        <div className="flex items-center gap-2">
          <Checkbox id="auto-track" className={checkboxClassName} />
          <label htmlFor="auto-track" className="text-sm text-muted-foreground">
            Auto-track this partnership status
          </label>
        </div>
        */}
      </div>
    </div>
  );
}
