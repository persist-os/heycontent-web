'use client';

import React, { useState, useEffect } from 'react';
import { useTimelineStore, ZoomLevel } from './useTimelineStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePersonaTimelineData } from '../hooks/usePersonaTimelineData';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { TimelineScroller } from './TimelineScroller';

export const TimelineControls: React.FC = () => {
  const { visibleDateRange, zoomLevel, setZoomLevel, setVisibleDateRange } = useTimelineStore();
  const [userId, setUserId] = useState<string | undefined>();

  // Get user ID from API key in cookies
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    setUserId(currentUserId || undefined);
  }, []);

  // Fetch timeline data to find most recent activity
  const { 
    conversations, 
    notes, 
    allContentData, 
    allAnalyticsData, 
    personas,
    isLoading
  } = usePersonaTimelineData(userId);

  // Function to extract date from an item using multiple possible date fields
  const extractDate = (item: any) => {
    // Try common date fields in order of preference (consistent with MonthView.tsx)
    const dateFields = ['date', 'createdAt', '_creationTime', 'updatedAt'];
    
    for (const field of dateFields) {
      const value = item[field];
      if (value) {
        if (typeof value === 'number') {
          return new Date(value);
        } else if (value instanceof Date) {
          return value;
        } else if (typeof value === 'string') {
          const parsed = new Date(value);
          if (!isNaN(parsed.getTime())) {
            return parsed;
          }
        }
      }
    }
    
    // For content items, also check nested date fields
    if (item.data?.timestamp) {
      return new Date(item.data.timestamp);
    }
    if (item.snippet?.published_at) {
      return new Date(item.snippet.published_at);
    }
    
    return null;
  };

  // Function to find the most recent data across all timeline sources
  const findMostRecentDataDate = () => {
    const allDates: Date[] = [];

    // Add conversation dates
    if (conversations) {
      conversations.forEach(conv => {
        const date = extractDate(conv);
        if (date) allDates.push(date);
      });
    }

    // Add note dates
    if (notes) {
      notes.forEach(note => {
        const date = extractDate(note);
        if (date) allDates.push(date);
      });
    }

    // Add content data dates
    if (allContentData) {
      allContentData.forEach(content => {
        const date = extractDate(content);
        if (date) allDates.push(date);
      });
    }

    // Add analytics data dates
    if (allAnalyticsData) {
      allAnalyticsData.forEach(analytics => {
        const date = extractDate(analytics);
        if (date) allDates.push(date);
      });
    }

    // Add persona dates
    if (personas) {
      personas.forEach(persona => {
        const date = extractDate(persona);
        if (date) allDates.push(date);
      });
    }

    // Find the most recent date, or fall back to current date if no data
    if (allDates.length === 0) {
      return new Date();
    }

    const mostRecentDate = new Date(Math.max(...allDates.map(date => date.getTime())));
    return mostRecentDate;
  };

  // Function to snap to period with most recent data based on zoom level
  const snapToPresent = (newZoomLevel: ZoomLevel) => {
    const mostRecentDate = findMostRecentDataDate();
    let start: Date, end: Date;

    switch (newZoomLevel) {
      case 'year':
        start = new Date(mostRecentDate.getFullYear(), 0, 1);
        end = new Date(mostRecentDate.getFullYear(), 11, 31);
        break;
      case 'month':
        start = new Date(mostRecentDate.getFullYear(), mostRecentDate.getMonth(), 1);
        end = new Date(mostRecentDate.getFullYear(), mostRecentDate.getMonth() + 1, 0);
        break;
      case 'week':
        const startOfWeek = new Date(mostRecentDate);
        startOfWeek.setDate(mostRecentDate.getDate() - mostRecentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        start = startOfWeek;
        end = endOfWeek;
        break;
      default:
        start = new Date(mostRecentDate.getFullYear(), 0, 1);
        end = new Date(mostRecentDate.getFullYear(), 11, 31);
    }

    setZoomLevel(newZoomLevel);
    setVisibleDateRange(start, end);
    // Also set centerDate so TimelineScroller loads a wide, scrollable range
    if (TimelineScroller.setCenterDate) {
      TimelineScroller.setCenterDate(mostRecentDate);
    }
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
                  snapToPresent(period.value);
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