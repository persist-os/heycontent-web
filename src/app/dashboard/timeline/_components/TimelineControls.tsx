'use client';

import React from 'react';
import { useTimelineStore, ZoomLevel } from './useTimelineStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const TimelineControls: React.FC = () => {
  const { visibleDateRange, zoomLevel, setZoomLevel, setVisibleDateRange } = useTimelineStore();

  // Function to snap to present based on zoom level - use current date
  const snapToPresent = (newZoomLevel: ZoomLevel) => {
    const now = new Date();
    let start: Date, end: Date;

    switch (newZoomLevel) {
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case 'month':
        // Use current month
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'week':
        // Use current week
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        start = startOfWeek;
        end = endOfWeek;
        break;
      default:
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
    }

    setZoomLevel(newZoomLevel);
    setVisibleDateRange(start, end);
  };

  // Function to set specific month
  const setMonth = (month: number, year?: number) => {
    const targetYear = year || visibleDateRange.start.getFullYear();
    const start = new Date(targetYear, month, 1);
    const end = new Date(targetYear, month + 1, 0);
    setVisibleDateRange(start, end);
  };

  // Week navigation functions for roadmap view
  const navigateWeek = (direction: 'prev' | 'next') => {
    const currentStart = new Date(visibleDateRange.start);
    const currentEnd = new Date(visibleDateRange.end);
    
    if (direction === 'prev') {
      currentStart.setDate(currentStart.getDate() - 7);
      currentEnd.setDate(currentEnd.getDate() - 7);
    } else {
      currentStart.setDate(currentStart.getDate() + 7);
      currentEnd.setDate(currentEnd.getDate() + 7);
    }
    
    setVisibleDateRange(currentStart, currentEnd);
  };

  // Month navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    const currentDate = new Date(visibleDateRange.start);
    if (direction === 'prev') {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    setVisibleDateRange(start, end);
  };

  // Function to go to current month
  const goToCurrentMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setVisibleDateRange(start, end);
  };

  // Function to go to current week
  const goToCurrentWeek = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    setVisibleDateRange(startOfWeek, endOfWeek);
  };

  // Format date for display in roadmap view
  const formatDateRange = () => {
    if (zoomLevel === 'week') {
      const start = visibleDateRange.start;
      const end = visibleDateRange.end;
      
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${end.getDate()}, ${start.getFullYear()}`;
      } else {
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`;
      }
    }
    return `${visibleDateRange.start.getFullYear()}`;
  };

  // Format date for display in month view
  const formatMonthRange = () => {
    return visibleDateRange.start.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="w-full bg-background border-t">
      <div className="flex flex-col items-center justify-center p-4 max-w-4xl mx-auto">
        
        {/* Conditional navigation based on zoom level */}
        {zoomLevel === 'week' ? (
          // Week-by-week navigation for roadmap view
          <div className="flex justify-center items-center space-x-6 mb-4">
            <div className="text-center">
              <div 
                className="text-lg font-semibold text-foreground"
              >
                {formatDateRange()}
              </div>
              <div className="text-xs text-muted-foreground">
                Roadmap View
              </div>
            </div>
          </div>
        ) : zoomLevel === 'month' ? (
          // Month view - display only (no navigation)
          <div className="flex justify-center items-center space-x-6 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">
                {formatMonthRange()}
              </div>
              <div className="text-xs text-muted-foreground">
                Month View
              </div>
            </div>
          </div>
        ) : (
          // Year display for year view - show current year
          <div className="flex justify-center items-center space-x-8 mb-4">
            <div className="text-lg font-bold text-primary bg-primary/10 border border-primary/30 px-3 py-2 rounded-lg">
              {visibleDateRange.start.getFullYear()}
            </div>
          </div>
        )}
        
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
                  console.log('🔴 TimelineControls button clicked:', period.value);
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