'use client';

import React from 'react';
import { useTimelineStore, ZoomLevel } from './useTimelineStore';

export const TimelineControls: React.FC = () => {
  const { visibleDateRange, zoomLevel, setZoomLevel } = useTimelineStore();

  // Format date for display based on zoom level
  const formatDateRange = () => {
    if (zoomLevel === 'week') {
      const start = visibleDateRange.start;
      const end = visibleDateRange.end;
      
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${end.getDate()}, ${start.getFullYear()}`;
      } else {
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`;
      }
    } else if (zoomLevel === 'month') {
    return visibleDateRange.start.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    } else {
      return `${visibleDateRange.start.getFullYear()}`;
    }
  };

  // Get display label for current zoom level
  const getViewLabel = () => {
    switch (zoomLevel) {
      case 'week': return 'Roadmap View';
      case 'month': return 'Month View';
      case 'year': return 'Year View';
      default: return 'Timeline View';
    }
  };

  return (
    <div className="w-full bg-background border-t">
      <div className="flex flex-col items-center justify-center p-4 max-w-4xl mx-auto">
        
        {/* Date range display */}
          <div className="flex justify-center items-center space-x-6 mb-4">
            <div className="text-center">
            <div className="text-lg font-semibold text-foreground">
                {formatDateRange()}
              </div>
              <div className="text-xs text-muted-foreground">
              {getViewLabel()}
            </div>
            </div>
          </div>
        
        {/* Time range selector */}
        <div className="flex justify-center items-center space-x-6">
          {[
            { label: 'Yearly', value: 'year' as ZoomLevel },
            { label: 'Monthly', value: 'month' as ZoomLevel },
            { label: 'Weekly', value: 'week' as ZoomLevel }
          ].map((period) => {
            const isActive = zoomLevel === period.value;
            
            return (
              <button
                key={period.value}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
                onClick={() => {
                  setZoomLevel(period.value);
                }}
              >
                {period.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 