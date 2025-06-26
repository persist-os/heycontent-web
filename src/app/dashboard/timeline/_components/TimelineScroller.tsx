'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTimelineStore, ZoomLevel } from './useTimelineStore';
import { YearView } from './YearView';
import { MonthView } from './MonthView';
import { RoadmapView } from './RoadmapView';
import { TimelineControls } from './TimelineControls';
import { usePersonaTimelineData } from '../hooks/usePersonaTimelineData';
import { getCurrentUserId } from '@/app/lib/api-helpers';

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
  
  // Add flag to prevent ALL automatic changes - user must explicitly navigate
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isUserDriven, setIsUserDriven] = useState(false); // Track if changes are user-initiated

  // Performance optimization refs
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const zoomThrottleRef = useRef<NodeJS.Timeout | null>(null);

  // Throttle ref for scroll operations
  const scrollToPositionThrottleRef = useRef<NodeJS.Timeout | null>(null);

  // Get user ID from API key in cookies
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    setUserId(currentUserId || undefined);
  }, []);

  // Cleanup all performance-related refs on unmount
  useEffect(() => {
    return () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (scrollThrottleRef.current) {
        clearTimeout(scrollThrottleRef.current);
      }
      if (zoomThrottleRef.current) {
        clearTimeout(zoomThrottleRef.current);
      }
      if (scrollToPositionThrottleRef.current) {
        clearTimeout(scrollToPositionThrottleRef.current);
      }
    };
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

  // Initial load: set periods and visibleDateRange to center period
  useEffect(() => {
    if (hasInitialized) return; // Only run once

    // Center on current date for the current zoom level
    const now = new Date();
    const initialPeriods = generatePeriodsForZoom(now, zoomLevel, 7);
    setLoadedPeriods(initialPeriods);

    // Set visibleDateRange to the center period
    const centerIdx = Math.floor(initialPeriods.length / 2);
    const centerPeriod = initialPeriods[centerIdx];
    if (centerPeriod) {
      setVisibleDateRange(centerPeriod.start, centerPeriod.end);
      setCenterDate(new Date((centerPeriod.start.getTime() + centerPeriod.end.getTime()) / 2));
    }

    // Scroll to center period after DOM update
    setTimeout(() => {
      if (scrollContainerRef.current && initialPeriods.length > 0) {
        const containerWidth = scrollContainerRef.current.clientWidth;
        const scrollWidth = scrollContainerRef.current.scrollWidth;
        const periodWidth = scrollWidth / initialPeriods.length;
        const targetScrollLeft = (centerIdx * periodWidth) - (containerWidth / 2) + (periodWidth / 2);
        scrollContainerRef.current.scrollLeft = Math.max(0, targetScrollLeft);
      }
    }, 100);

    setHasInitialized(true);
  }, []);

  // REMOVE automatic external date range handling - let user control navigation
  // Users can navigate using TimelineControls or explicit interactions

  useEffect(() => {
    isExtendingRef.current = isExtending;
  }, [isExtending]);

  // DISABLE automatic period extension - only extend on explicit user scroll
  const extendPeriodsIfNeeded = useCallback((scrollLeft: number, containerWidth: number, scrollWidth: number) => {
    // Only extend if user is actively scrolling (not automatic changes)
    if (isExtendingRef.current || !isUserDriven) return;
    
    const maxScrollLeft = scrollWidth - containerWidth;
    const leftThreshold = scrollWidth * 0.1; // Reduce sensitivity
    const rightThreshold = scrollWidth * 0.9; // Reduce sensitivity
    
    if (scrollLeft <= leftThreshold) {
      setIsExtending(true);
      isExtendingRef.current = true;
      const newPeriods = extendPeriods(loadedPeriods, 'left', zoomLevel, 2); // Extend less
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
      const newPeriods = extendPeriods(loadedPeriods, 'right', zoomLevel, 2); // Extend less
      setLoadedPeriods(prev => [...prev, ...newPeriods]);
      setTimeout(() => {
        setIsExtending(false);
        isExtendingRef.current = false;
      }, 50);
    }
  }, [loadedPeriods, zoomLevel, isUserDriven]);

  // ENABLE visible date range updates during user scroll to fix stuck year display
  const updateVisibleDateRange = useCallback((scrollLeft: number, containerWidth: number, scrollWidth: number) => {
    // Only update if user is actively scrolling and we have loaded periods
    if (loadedPeriods.length === 0 || !isUserDriven) return;
    
    // Calculate which period is most visible based on scroll position
    const scrollProgress = scrollLeft / Math.max(scrollWidth - containerWidth, 1);
    const periodIndex = Math.floor(scrollProgress * loadedPeriods.length);
    const safePeriodIndex = Math.max(0, Math.min(periodIndex, loadedPeriods.length - 1));
    
    const visiblePeriod = loadedPeriods[safePeriodIndex];
    if (visiblePeriod && 
        (visibleDateRange.start.getTime() !== visiblePeriod.start.getTime() || 
         visibleDateRange.end.getTime() !== visiblePeriod.end.getTime())) {
      setVisibleDateRange(visiblePeriod.start, visiblePeriod.end);
    }
  }, [loadedPeriods, visibleDateRange, setVisibleDateRange, isUserDriven]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const containerWidth = e.currentTarget.clientWidth;
    const scrollWidth = e.currentTarget.scrollWidth;
    
    setScrollPosition(scrollLeft);
    setIsUserDriven(true); // Mark as user-driven
    
    // Throttle expensive operations during scroll
    if (scrollThrottleRef.current) return;
    
    scrollThrottleRef.current = setTimeout(() => {
      // Extend periods if near edges (only if user-driven)
      extendPeriodsIfNeeded(scrollLeft, containerWidth, scrollWidth);
      
      // Update visible date range (only if user-driven)
      updateVisibleDateRange(scrollLeft, containerWidth, scrollWidth);
      
      scrollThrottleRef.current = null;
      
      // Reset user-driven flag after scroll operations
      setTimeout(() => setIsUserDriven(false), 200);
    }, 150); // Increase throttle delay
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsUserDriven(true); // Mark as user-driven
    setDragStart({
      x: e.pageX,
      scrollLeft: scrollContainerRef.current?.scrollLeft || 0,
    });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    
    // Use requestAnimationFrame for smoother dragging instead of throttling
    if (animationFrameRef.current) return;
    
    animationFrameRef.current = requestAnimationFrame(() => {
      if (!scrollContainerRef.current) {
        animationFrameRef.current = null;
        return;
      }
      
      const x = e.pageX;
      const walk = (x - dragStart.x) * 1;
      scrollContainerRef.current.scrollLeft = dragStart.scrollLeft - walk;
      animationFrameRef.current = null;
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
    // Reset user-driven flag after drag ends
    setTimeout(() => setIsUserDriven(false), 200);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (zoomThrottleRef.current) return;
      const zoomSequence = ['year', 'month', 'week'];
      const currentZoomIndex = zoomSequence.indexOf(zoomLevel);
      zoomThrottleRef.current = setTimeout(() => {
        zoomThrottleRef.current = null;
      }, 300);
      let nextZoom: ZoomLevel | null = null;
      if (e.deltaY < 0 && currentZoomIndex < zoomSequence.length - 1) {
        nextZoom = zoomSequence[currentZoomIndex + 1] as ZoomLevel;
      } else if (e.deltaY > 0 && currentZoomIndex > 0) {
        nextZoom = zoomSequence[currentZoomIndex - 1] as ZoomLevel;
      }
      if (nextZoom) {
        useTimelineStore.getState().setZoomLevel(nextZoom);
        // Center on current visibleDateRange
        const center = new Date((visibleDateRange.start.getTime() + visibleDateRange.end.getTime()) / 2);
        setTimeout(() => {
          const newPeriods = generatePeriodsForZoom(center, nextZoom!, 7);
          setLoadedPeriods(newPeriods);
          const centerIdx = Math.floor(newPeriods.length / 2);
          const centerPeriod = newPeriods[centerIdx];
          if (centerPeriod) {
            setVisibleDateRange(centerPeriod.start, centerPeriod.end);
            setCenterDate(new Date((centerPeriod.start.getTime() + centerPeriod.end.getTime()) / 2));
          }
        }, 100);
      }
      return;
    }
    
    // Allow horizontal scroll but mark as user-driven
    setIsUserDriven(true);
    
    // Horizontal scroll - use throttling
    if (throttleRef.current) return;
    
    // Reduce scroll sensitivity
    throttleRef.current = setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft += e.deltaY * 0.05; // Reduced sensitivity
      }
      throttleRef.current = null;
      
      // Reset user-driven flag
      setTimeout(() => setIsUserDriven(false), 200);
    }, 50); // Increased throttle delay
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

  // When visibleDateRange changes, scroll to the matching period
  useEffect(() => {
    if (!hasInitialized || loadedPeriods.length === 0 || !scrollContainerRef.current) return;
    if (!visibleDateRange.start || !visibleDateRange.end) return;
    // Find the period that matches visibleDateRange
    const targetPeriodIndex = loadedPeriods.findIndex(period =>
      period.start.getTime() === visibleDateRange.start.getTime() &&
      period.end.getTime() === visibleDateRange.end.getTime()
    );
    if (targetPeriodIndex !== -1) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      const scrollWidth = scrollContainerRef.current.scrollWidth;
      const periodWidth = scrollWidth / loadedPeriods.length;
      const targetScrollLeft = (targetPeriodIndex * periodWidth) - (containerWidth / 2) + (periodWidth / 2);
      scrollContainerRef.current.scrollLeft = Math.max(0, targetScrollLeft);
    }
  }, [visibleDateRange, hasInitialized, loadedPeriods]);

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