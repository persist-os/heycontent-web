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
  // Generate theme-based color classes
  const getThemeClasses = (color: string) => {
    const colors = {
      blue: {
        selectBg: 'bg-blue-50 dark:bg-blue-950/20',
        selectBorder: 'border-blue-200 dark:border-blue-800/50',
        selectHover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
        checkboxBorder: 'border-blue-300 dark:border-blue-700',
      },
      purple: {
        selectBg: 'bg-purple-50 dark:bg-purple-950/20',
        selectBorder: 'border-purple-200 dark:border-purple-800/50',
        selectHover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
        checkboxBorder: 'border-purple-300 dark:border-purple-700',
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const themeClasses = getThemeClasses(themeColor);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        {/* Type Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Type:</span>
          <Select value={partnership.category || 'partnership'} onValueChange={onCategoryChange}>
            <SelectTrigger className={`w-32 h-8 ${themeClasses.selectBg} ${themeClasses.selectBorder} text-foreground ${themeClasses.selectHover}`}>
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
            <SelectTrigger className={`w-32 h-8 ${themeClasses.selectBg} ${themeClasses.selectBorder} text-foreground ${themeClasses.selectHover}`}>
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
          <Checkbox id="auto-track" className={themeClasses.checkboxBorder} />
          <label htmlFor="auto-track" className="text-sm text-muted-foreground">
            Auto-track this partnership status
          </label>
        </div>
      </div>
    </div>
  );
}
