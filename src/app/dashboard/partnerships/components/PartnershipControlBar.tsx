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
  // Generate theme-based color classes using exact hex colors from CategoryEmailList
  const getThemeClasses = (color: string) => {
    const colors = {
      // Partnership - #9D89F7 (Purple)
      purple: {
        selectBg: 'bg-[#9D89F7]/[0.11] dark:bg-[#9D89F7]/[0.08]',
        selectBorder: 'border-[#9D89F7]/20 dark:border-[#9D89F7]/30',
        selectHover: 'hover:bg-[#9D89F7]/[0.15] dark:hover:bg-[#9D89F7]/[0.12]',
        checkboxBorder: 'border-[#9D89F7]/30 dark:border-[#9D89F7]/50',
      },
      // Media - #FF96FB (Pink)
      pink: {
        selectBg: 'bg-[#FF96FB]/[0.11] dark:bg-[#FF96FB]/[0.08]',
        selectBorder: 'border-[#FF96FB]/20 dark:border-[#FF96FB]/30',
        selectHover: 'hover:bg-[#FF96FB]/[0.15] dark:hover:bg-[#FF96FB]/[0.12]',
        checkboxBorder: 'border-[#FF96FB]/30 dark:border-[#FF96FB]/50',
      },
      // Business - #40E3FF (Teal)
      teal: {
        selectBg: 'bg-[#40E3FF]/[0.11] dark:bg-[#40E3FF]/[0.08]',
        selectBorder: 'border-[#40E3FF]/20 dark:border-[#40E3FF]/30',
        selectHover: 'hover:bg-[#40E3FF]/[0.15] dark:hover:bg-[#40E3FF]/[0.12]',
        checkboxBorder: 'border-[#40E3FF]/30 dark:border-[#40E3FF]/50',
      },
      // Community - #9BE7B2 (Green)
      green: {
        selectBg: 'bg-[#9BE7B2]/[0.11] dark:bg-[#9BE7B2]/[0.08]',
        selectBorder: 'border-[#9BE7B2]/20 dark:border-[#9BE7B2]/30',
        selectHover: 'hover:bg-[#9BE7B2]/[0.15] dark:hover:bg-[#9BE7B2]/[0.12]',
        checkboxBorder: 'border-[#9BE7B2]/30 dark:border-[#9BE7B2]/50',
      },
      // Default/Uncategorized - Yellow
      yellow: {
        selectBg: 'bg-yellow-50 dark:bg-yellow-950/20',
        selectBorder: 'border-yellow-200 dark:border-yellow-800/50',
        selectHover: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
        checkboxBorder: 'border-yellow-300 dark:border-yellow-700',
      }
    };
    return colors[color as keyof typeof colors] || colors.yellow;
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
