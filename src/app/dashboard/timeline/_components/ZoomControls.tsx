'use client';

import React from 'react';
import { ZoomLevel, useTimelineStore } from './useTimelineStore';
import { cn } from '@/lib/utils';

export const ZoomControls: React.FC = () => {
  const { zoomLevel, setZoomLevel } = useTimelineStore();

  const zoomOptions: { level: ZoomLevel; label: string }[] = [
    { level: 'year', label: 'Yearly' },
    { level: 'month', label: 'Monthly' },
    { level: 'week', label: 'Weekly' },
  ];

  return (
    <div className="flex items-center justify-center space-x-1 bg-muted rounded-lg p-1">
      {zoomOptions.map(({ level, label }) => (
        <button
          key={level}
          onClick={() => setZoomLevel(level)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
            zoomLevel === level
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}; 