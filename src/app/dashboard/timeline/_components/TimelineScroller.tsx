'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTimelineStore, ZoomLevel } from './useTimelineStore';
import { YearView } from './YearView';
import { MonthView } from './MonthView';
import { RoadmapView } from './RoadmapView';
import { TimelineControls } from './TimelineControls';
import { usePersonaTimelineData } from '../hooks/usePersonaTimelineData';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import isEqual from 'lodash/isEqual';

// Period interface for managing loaded timeline segments
interface Period {
  start: Date;
  end: Date;
  key: string; // unique identifier for the period
}

// Generate periods based on zoom level
const generatePeriodsForZoom = (centerDate: Date, zoomLevel: ZoomLevel, count: number = 5): Period[] => {
  const periods: Period[] = [];
  const halfCount = Math.floor(count / 2);
  
  switch (zoomLevel) {
    case 'year':
      for (let i = -halfCount; i <= halfCount; i++) {
        const year = centerDate.getFullYear() + i;
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31, 23, 59, 59, 999);
        periods.push({
          start,
          end,
          key: `year-${year}`
        });
      }
      break;
      
    case 'month':
      const centerMonth = centerDate.getMonth();
      const centerYear = centerDate.getFullYear();
      for (let i = -halfCount; i <= halfCount; i++) {
        const date = new Date(centerYear, centerMonth + i, 1);
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        periods.push({
          start,
          end,
          key: `month-${date.getFullYear()}-${date.getMonth()}`
        });
      }
      break;
      
    case 'week':
      const centerWeekStart = new Date(centerDate);
      centerWeekStart.setDate(centerDate.getDate() - centerDate.getDay());
      centerWeekStart.setHours(0, 0, 0, 0);
      
      for (let i = -halfCount; i <= halfCount; i++) {
        const start = new Date(centerWeekStart);
        start.setDate(centerWeekStart.getDate() + (i * 7));
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        periods.push({
          start,
          end,
          key: `week-${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`
        });
      }
      break;
  }
  
  return periods.sort((a, b) => a.start.getTime() - b.start.getTime());
};

// Extend periods in a direction
const extendPeriods = (periods: Period[], direction: 'left' | 'right', zoomLevel: ZoomLevel, count: number = 2): Period[] => {
  const newPeriods: Period[] = [];
  
  if (direction === 'left') {
    const firstPeriod = periods[0];
    for (let i = count; i >= 1; i--) {
      let start: Date, end: Date, key: string;
      
      switch (zoomLevel) {
        case 'year':
          const year = firstPeriod.start.getFullYear() - i;
          start = new Date(year, 0, 1);
          end = new Date(year, 11, 31, 23, 59, 59, 999);
          key = `year-${year}`;
          break;
          
        case 'month':
          const monthDate = new Date(firstPeriod.start);
          monthDate.setMonth(monthDate.getMonth() - i);
          start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
          end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
          key = `month-${monthDate.getFullYear()}-${monthDate.getMonth()}`;
          break;
          
        case 'week':
          const weekDate = new Date(firstPeriod.start);
          weekDate.setDate(weekDate.getDate() - (i * 7));
          start = new Date(weekDate);
          end = new Date(weekDate);
          end.setDate(weekDate.getDate() + 6);
          end.setHours(23, 59, 59, 999);
          key = `week-${weekDate.getFullYear()}-${weekDate.getMonth()}-${weekDate.getDate()}`;
          break;
          
        default:
          continue;
      }
      
      newPeriods.push({ start, end, key });
    }
  } else {
    const lastPeriod = periods[periods.length - 1];
    for (let i = 1; i <= count; i++) {
      let start: Date, end: Date, key: string;
      
      switch (zoomLevel) {
        case 'year':
          const year = lastPeriod.start.getFullYear() + i;
          start = new Date(year, 0, 1);
          end = new Date(year, 11, 31, 23, 59, 59, 999);
          key = `year-${year}`;
          break;
          
        case 'month':
          const monthDate = new Date(lastPeriod.start);
          monthDate.setMonth(monthDate.getMonth() + i);
          start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
          end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
          key = `month-${monthDate.getFullYear()}-${monthDate.getMonth()}`;
          break;
          
        case 'week':
          const weekDate = new Date(lastPeriod.start);
          weekDate.setDate(weekDate.getDate() + (i * 7));
          start = new Date(weekDate);
          end = new Date(weekDate);
          end.setDate(weekDate.getDate() + 6);
          end.setHours(23, 59, 59, 999);
          key = `week-${weekDate.getFullYear()}-${weekDate.getMonth()}-${weekDate.getDate()}`;
          break;
          
        default:
          continue;
      }
      
      newPeriods.push({ start, end, key });
    }
  }
  
  return newPeriods;
};

export const TimelineScroller: React.FC = () => {
  const { 
    zoomLevel, 
    scrollPosition, 
    setScrollPosition, 
    setVisibleDateRange,
    visibleDateRange 
  } = useTimelineStore();
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
  const [userId, setUserId] = useState<string | undefined>();
  
  // Infinite scroll state
  const [loadedPeriods, setLoadedPeriods] = useState<Period[]>([]);
  const [isExtending, setIsExtending] = useState(false);
  const isExtendingRef = useRef(false);
  const [centerDate, setCenterDate] = useState(new Date());

  // Get user ID from API key in cookies
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    setUserId(currentUserId || undefined);
  }, []);

  // Fetch timeline data for all loaded periods
  const { 
    conversations, 
    notes, 
    allContentData, 
    allAnalyticsData, 
    personas,
    isLoading,
    getFolderCount,
    getFolderItems
  } = usePersonaTimelineData(userId);

  // Initialize periods when zoom level changes or on first load
  useEffect(() => {
    const initialPeriods = generatePeriodsForZoom(centerDate, zoomLevel, 7); // Load 7 periods initially
    setLoadedPeriods(initialPeriods);
    
    // Set the visible date range to the center period
    const centerPeriod = initialPeriods[Math.floor(initialPeriods.length / 2)];
    if (centerPeriod) {
      setVisibleDateRange(centerPeriod.start, centerPeriod.end);
    }
  }, [zoomLevel, centerDate, setVisibleDateRange]);

  // Listen for external date range changes (e.g., from TimelineControls) and update periods
  useEffect(() => {
    if (!visibleDateRange.start || !visibleDateRange.end) return;
    
    // Check if the current visible range is covered by loaded periods
    const isRangeCovered = loadedPeriods.some(period => 
      visibleDateRange.start >= period.start && visibleDateRange.end <= period.end
    );
    
    if (!isRangeCovered) {
      // Use the middle of the visible range as the new center date
      const newCenterDate = new Date(
        (visibleDateRange.start.getTime() + visibleDateRange.end.getTime()) / 2
      );
      // Generate new periods around the visible range
      const newPeriods = generatePeriodsForZoom(newCenterDate, zoomLevel, 7);
      // Only update if periods are actually different
      if (!isEqual(newPeriods, loadedPeriods)) {
        setLoadedPeriods(newPeriods);
      }
    }
  }, [visibleDateRange, zoomLevel]);

  useEffect(() => {
    isExtendingRef.current = isExtending;
  }, [isExtending]);

  // Extend periods when near edges
  const extendPeriodsIfNeeded = useCallback((scrollLeft: number, containerWidth: number, scrollWidth: number) => {
    if (isExtendingRef.current) return;
    
    const maxScrollLeft = scrollWidth - containerWidth;
    const leftThreshold = scrollWidth * 0.15; // Extend when 15% from left
    const rightThreshold = scrollWidth * 0.85; // Extend when 85% from left
    
    if (scrollLeft <= leftThreshold) {
      setIsExtending(true);
      isExtendingRef.current = true;
      const newPeriods = extendPeriods(loadedPeriods, 'left', zoomLevel, 3);
      setLoadedPeriods(prev => [...newPeriods, ...prev]);
      // Adjust scroll position to prevent jumping
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const newScrollWidth = scrollContainerRef.current.scrollWidth;
          const addedWidth = newScrollWidth - scrollWidth;
          scrollContainerRef.current.scrollLeft = scrollLeft + addedWidth;
        }
        setIsExtending(false);
        isExtendingRef.current = false;
      }, 50);
    } else if (scrollLeft >= rightThreshold) {
      setIsExtending(true);
      isExtendingRef.current = true;
      const newPeriods = extendPeriods(loadedPeriods, 'right', zoomLevel, 3);
      setLoadedPeriods(prev => [...prev, ...newPeriods]);
      setTimeout(() => {
        setIsExtending(false);
        isExtendingRef.current = false;
      }, 50);
    }
  }, [loadedPeriods, zoomLevel]);

  // Update visible date range based on scroll position
  const updateVisibleDateRange = useCallback((scrollLeft: number, containerWidth: number, scrollWidth: number) => {
    if (loadedPeriods.length === 0) return;
    
    // Calculate which period is most visible based on scroll position
    const scrollProgress = scrollLeft / (scrollWidth - containerWidth);
    const periodIndex = Math.floor(scrollProgress * loadedPeriods.length);
    const safePeriodIndex = Math.max(0, Math.min(periodIndex, loadedPeriods.length - 1));
    
    const visiblePeriod = loadedPeriods[safePeriodIndex];
    if (visiblePeriod && 
        (visibleDateRange.start.getTime() !== visiblePeriod.start.getTime() || 
         visibleDateRange.end.getTime() !== visiblePeriod.end.getTime())) {
      setVisibleDateRange(visiblePeriod.start, visiblePeriod.end);
    }
  }, [loadedPeriods, visibleDateRange, setVisibleDateRange]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const containerWidth = e.currentTarget.clientWidth;
    const scrollWidth = e.currentTarget.scrollWidth;
    
    setScrollPosition(scrollLeft);
    
    // Extend periods if near edges
    extendPeriodsIfNeeded(scrollLeft, containerWidth, scrollWidth);
    
    // Update visible date range
    updateVisibleDateRange(scrollLeft, containerWidth, scrollWidth);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.pageX,
      scrollLeft: scrollContainerRef.current?.scrollLeft || 0,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    
    e.preventDefault();
    const x = e.pageX;
    const walk = (x - dragStart.x) * 1;
    scrollContainerRef.current.scrollLeft = dragStart.scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Handle zoom with wheel - year -> month -> week sequence
      const zoomSequence = ['year', 'month', 'week'];
      const currentZoomIndex = zoomSequence.indexOf(zoomLevel);
      
      if (e.deltaY < 0 && currentZoomIndex < zoomSequence.length - 1) {
        // Zoom in (year -> month -> week)
        const nextZoom = zoomSequence[currentZoomIndex + 1];
        useTimelineStore.getState().setZoomLevel(nextZoom as any);
      } else if (e.deltaY > 0 && currentZoomIndex > 0) {
        // Zoom out (week -> month -> year)
        const nextZoom = zoomSequence[currentZoomIndex - 1];
        useTimelineStore.getState().setZoomLevel(nextZoom as any);
      }
    } else {
      // Horizontal scroll - reduced sensitivity
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft += e.deltaY * 0.2;
      }
    }
  };

  const renderCurrentView = () => {
    const viewProps = {
      loadedPeriods,
      conversations: conversations || [],
      notes: notes || [],
      allContentData: allContentData || [],
      allAnalyticsData: allAnalyticsData || [],
      personas: personas || [],
      getFolderCount,
      getFolderItems
    };

    switch (zoomLevel) {
      case 'week':
        return <RoadmapView {...viewProps} />;
      case 'month':
        return <MonthView {...viewProps} />;
      default:
        return <YearView {...viewProps} />;
    }
  };

  // Calculate dynamic width based on loaded periods
  const dynamicWidth = Math.max(300, loadedPeriods.length * 100); // Minimum 300vw, scale with periods

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Timeline Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div 
          className="h-full"
          style={{ 
            minWidth: `${dynamicWidth}vw`,
            width: `${dynamicWidth}vw`
          }}
        >
          {renderCurrentView()}
        </div>
      </div>

      {/* Timeline Controls */}
      <TimelineControls />
    </div>
  );
}; 