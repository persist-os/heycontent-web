'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useTimelineStore } from '../_components/useTimelineStore';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { usePersonaTimelineData } from './usePersonaTimelineData';
import { useRouter } from 'next/navigation';

// Props interface for MonthView hook
interface UseMonthViewProps {
  loadedPeriods: Array<{
    start: Date;
    end: Date;
    key: string;
  }>;
  conversations: any[];
  notes: any[];
  allContentData: any[];
  allAnalyticsData: any[];
  personas: any[];
}

// Interface for persona bucket data
interface PersonaBucketData {
  personas: any[];
  startDay: number;
  endDay: number;
  month: number;
  year: number;
}

// Utility to group items by day and folder type
function groupDataByDay({ conversations, notes, allContentData, allAnalyticsData, visibleDateRange }) {
  const dayMap = {};
  
  // Helper function to safely extract date from various date field formats
  const extractDate = (item, defaultField = 'createdAt') => {
    // Try common date fields in order of preference
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
    
    console.warn('Could not extract valid date from item:', item);
    return null;
  };
  
  const add = (date, folderType, item) => {
    if (!date) return; // Skip items without valid dates
    
    const key = date.toISOString().slice(0, 10); // YYYY-MM-DD format
    if (!dayMap[key]) {
      dayMap[key] = {
        date: new Date(date),
        folders: {
          blue: { count: 0, items: [] },
          purple: { count: 0, items: [] },
          orange: { count: 0, items: [] },
          yellow: { count: 0, items: [] },
        },
      };
    }
    dayMap[key].folders[folderType].count++;
    dayMap[key].folders[folderType].items.push(item);
  };
  
  // Conversations (blue)
  (conversations || []).forEach(conv => {
    const d = extractDate(conv);
    if (d && d >= visibleDateRange.start && d <= visibleDateRange.end) {
      add(d, 'blue', conv);
    }
  });
  
  // Notes (purple)
  (notes || []).forEach(note => {
    const d = extractDate(note);
    if (d && d >= visibleDateRange.start && d <= visibleDateRange.end) {
      add(d, 'purple', note);
    }
  });
  
  // Content (orange)
  (allContentData || []).forEach(item => {
    const d = extractDate(item);
    if (d && d >= visibleDateRange.start && d <= visibleDateRange.end) {
      add(d, 'orange', item);
    }
  });
  
  // Analytics (yellow)
  (allAnalyticsData || []).forEach(item => {
    const d = extractDate(item);
    if (d && d >= visibleDateRange.start && d <= visibleDateRange.end) {
      add(d, 'yellow', item);
    }
  });
  
  return dayMap;
}

export const useMonthView = ({ 
  loadedPeriods, 
  conversations, 
  notes, 
  allContentData, 
  allAnalyticsData, 
  personas 
}: UseMonthViewProps) => {
  const { events, visibleDateRange, setVisibleDateRange, setZoomLevel } = useTimelineStore();
  const [userId, setUserId] = useState<string | undefined>();
  const [modalData, setModalData] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const router = useRouter();
  const hasInitializedDateRange = useRef(false);

  // Get user ID from API key in cookies
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    setUserId(currentUserId || undefined);
  }, []);

  // Get all personas (use passed prop instead of store)
  const allPersonas = personas;

  // Fetch all timeline data
  const {
    getFolderCount,
    getFolderItems,
    isLoading,
  } = usePersonaTimelineData(userId);

  // MonthView relies on store defaults and zoom level changes
  useEffect(() => {
    // Only set zoom level if we're not already in month view
    if (hasInitializedDateRange.current) return;
    
    setZoomLevel('month');
    hasInitializedDateRange.current = true;
  }, []); // Run only once on mount

  // Group data by day/folder for all loaded periods
  const dayMapsByPeriod = useMemo(() => {
    const periodMaps = {};
    
    loadedPeriods.forEach(period => {
      const fullMonthRange = { start: period.start, end: period.end };
      periodMaps[period.key] = groupDataByDay({ 
        conversations, 
        notes, 
        allContentData, 
        allAnalyticsData, 
        visibleDateRange: fullMonthRange 
      });
    });
    
    return periodMaps;
  }, [loadedPeriods, conversations, notes, allContentData, allAnalyticsData]);

  // Generate days for all loaded periods
  const allDaysInPeriods = useMemo(() => {
    const daySet = new Set();
    const allDays = [];
    
    loadedPeriods.forEach(period => {
      const start = new Date(period.start.getFullYear(), period.start.getMonth(), 1);
      const end = new Date(period.start.getFullYear(), period.start.getMonth() + 1, 0);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayString = d.toISOString().split('T')[0]; // YYYY-MM-DD format
        if (!daySet.has(dayString)) {
          daySet.add(dayString);
          allDays.push(new Date(d));
        }
      }
    });
    
    return allDays.sort((a, b) => a.getTime() - b.getTime());
  }, [loadedPeriods]);

  // Folder dot offsets for vertical line heights
  const folderDotOffsets = {
    blue: 120,    // Highest level
    purple: 90,   // Second level  
    orange: 60,   // Third level
    yellow: 30,   // Lowest level
  };

  const getEventPosition = (eventDate: Date) => {
    if (allDaysInPeriods.length === 0) return 0;
    
    const startTime = allDaysInPeriods[0].getTime();
    const endTime = allDaysInPeriods[allDaysInPeriods.length - 1].getTime();
    const eventTime = eventDate.getTime();
    
    const position = ((eventTime - startTime) / (endTime - startTime)) * 100;
    return Math.max(0, Math.min(100, position));
  };

  // Filter events for all loaded periods
  const eventsInAllPeriods = events.filter(event => {
    return loadedPeriods.some(period => {
      return event.date >= period.start && event.date <= period.end;
    });
  });

  // Group personas by 3-day buckets for all loaded periods
  const personasInAllPeriods = useMemo(() => {
    if (!allPersonas) return {};
    
    // Filter personas created in any loaded period
    const personasInRange = allPersonas.filter(persona => {
      const createdDate = new Date(persona.createdAt);
      return loadedPeriods.some(period => {
        return createdDate >= period.start && createdDate <= period.end;
      });
    });
    
    // Group by 3-day buckets for month view
    const personasByBucket = {};
    personasInRange.forEach(persona => {
      const createdDate = new Date(persona.createdAt);
      
      // Find which 3-day bucket this persona belongs to
      const dayOfMonth = createdDate.getDate();
      const bucketNumber = Math.floor((dayOfMonth - 1) / 3); // 0-based bucket index
      const bucketStartDay = bucketNumber * 3 + 1; // 1-based day
      
      // Create bucket key: YYYY-MM-bucket{N}
      const bucketKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}-bucket${bucketNumber}`;
      
      if (!personasByBucket[bucketKey]) {
        personasByBucket[bucketKey] = {
          personas: [],
          startDay: bucketStartDay,
          endDay: Math.min(bucketStartDay + 2, new Date(createdDate.getFullYear(), createdDate.getMonth() + 1, 0).getDate()),
          month: createdDate.getMonth(),
          year: createdDate.getFullYear()
        };
      }
      personasByBucket[bucketKey].personas.push(persona);
    });
    
    return personasByBucket;
  }, [allPersonas, loadedPeriods]);

  const getPersonaPositionForBucket = (bucketKey: string, bucketData: any) => {
    // Calculate position based on the middle day of the 3-day bucket
    const middleDay = Math.ceil((bucketData.startDay + bucketData.endDay) / 2);
    const targetDate = new Date(bucketData.year, bucketData.month, middleDay);
    
    // Find the corresponding day in the allDaysInPeriods array
    const dayInArray = allDaysInPeriods.find(d => 
      d.getFullYear() === targetDate.getFullYear() && 
      d.getMonth() === targetDate.getMonth() && 
      d.getDate() === targetDate.getDate()
    );
    const arrayIndex = allDaysInPeriods.indexOf(dayInArray);
    
    if (arrayIndex === -1) return 50; // Default to center if not found
    
    // Use the exact same positioning logic as the daily ticks
    const position = allDaysInPeriods.length > 1 ? (arrayIndex / (allDaysInPeriods.length - 1)) * 100 : 50;
    return Math.max(5, Math.min(95, position));
  };

  // Smart positioning to avoid overlaps for 3-day buckets
  const getVerticalPosition = (bucketKey: string, bucketData: any) => {
    const sortedBuckets = Object.keys(personasInAllPeriods).sort();
    const bucketIndex = sortedBuckets.indexOf(bucketKey);
    
    // Get horizontal position for this bucket
    const horizontalPosition = getPersonaPositionForBucket(bucketKey, bucketData);
    
    // Check for horizontal proximity conflicts with other cards
    const proximityThreshold = 15; // Larger threshold since buckets are wider
    const conflictingBuckets = sortedBuckets.filter((otherBucketKey, otherIndex) => {
      if (otherBucketKey === bucketKey || otherIndex >= bucketIndex) return false;
      const otherBucketData = personasInAllPeriods[otherBucketKey];
      const otherPosition = getPersonaPositionForBucket(otherBucketKey, otherBucketData);
      return Math.abs(horizontalPosition - otherPosition) < proximityThreshold;
    });
    
    // Determine positioning based on conflicts and index
    let isAbove: boolean;
    let verticalOffset: number;
    
    if (conflictingBuckets.length === 0) {
      // No conflicts, use simple alternating
      isAbove = bucketIndex % 2 === 0;
      verticalOffset = 0;
    } else {
      // Have conflicts, need smarter positioning
      const conflictCount = conflictingBuckets.length;
      
      if (conflictCount < 3) {
        isAbove = conflictCount % 2 === 0;
        verticalOffset = Math.floor(conflictCount / 2) * 80;
      } else {
        // For many conflicts, use both sides
        isAbove = bucketIndex % 2 === 0;
        verticalOffset = Math.floor(conflictCount / 3) * 60;
      }
    }
    
    const baseOffset = isAbove ? -140 : 60;
    const finalTop = baseOffset + (isAbove ? -verticalOffset : verticalOffset);
    
    return {
      isAbove,
      top: finalTop
    };
  };

  // State for managing stacked persona cards
  const [activePersonaIndex, setActivePersonaIndex] = useState<{ [bucketKey: string]: number }>({});

  // Handle clicking through stacked personas
  const handlePersonaStackClick = (bucketKey: string, personasArray: any[]) => {
    if (!personasArray || personasArray.length === 0) return;
    
    const currentIndex = activePersonaIndex[bucketKey] || 0;
    const safeCurrentIndex = Math.max(0, Math.min(currentIndex, personasArray.length - 1));
    const nextIndex = (safeCurrentIndex + 1) % personasArray.length;
    
    setActivePersonaIndex(prev => ({
      ...prev,
      [bucketKey]: nextIndex
    }));
  };

  const handlePersonaClick = (persona: any) => {
    setSelectedPersona(persona);
  };

  const handleViewFullPersona = () => {
    setSelectedPersona(null);
    router.push('/dashboard/self-hub?tab=persona');
  };

  return {
    // Data
    dayMapsByPeriod,
    allDaysInPeriods,
    eventsInAllPeriods,
    personasInAllPeriods,
    folderDotOffsets,
    activePersonaIndex,
    selectedPersona,
    modalData,
    userId,
    isLoading,
    
    // Functions
    getEventPosition,
    getPersonaPositionForBucket,
    getVerticalPosition,
    getFolderCount,
    getFolderItems,
    
    // Handlers
    handlePersonaStackClick,
    handlePersonaClick,
    handleViewFullPersona,
    
    // State setters
    setModalData,
    setSelectedPersona,
  };
}; 