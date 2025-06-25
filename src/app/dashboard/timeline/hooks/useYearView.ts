'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useTimelineStore } from '../_components/useTimelineStore';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { usePersonaTimelineData } from './usePersonaTimelineData';
import { useRouter } from 'next/navigation';

// Props interface for YearView hook
interface UseYearViewProps {
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

// Utility to group items by month and folder type
function groupDataByMonth({ conversations, notes, allContentData, allAnalyticsData, visibleDateRange }) {
  const monthMap = {};
  const add = (date, folderType, item) => {
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!monthMap[key]) {
      monthMap[key] = {
        date: new Date(date.getFullYear(), date.getMonth(), 1),
        folders: {
          blue: { count: 0, items: [] },
          purple: { count: 0, items: [] },
          orange: { count: 0, items: [] },
          yellow: { count: 0, items: [] },
        },
      };
    }
    monthMap[key].folders[folderType].count++;
    monthMap[key].folders[folderType].items.push(item);
  };
  // Conversations (blue)
  (conversations || []).forEach(conv => {
    const d = new Date(conv.createdAt);
    if (d >= visibleDateRange.start && d <= visibleDateRange.end) add(d, 'blue', conv);
  });
  // Notes (purple)
  (notes || []).forEach(note => {
    const d = new Date(note.createdAt);
    if (d >= visibleDateRange.start && d <= visibleDateRange.end) add(d, 'purple', note);
  });
  // Content (orange)
  (allContentData || []).forEach(item => {
    const d = new Date(item.date || item.createdAt);
    if (d >= visibleDateRange.start && d <= visibleDateRange.end) add(d, 'orange', item);
  });
  // Analytics (yellow)
  (allAnalyticsData || []).forEach(item => {
    const d = new Date(item.date || item.createdAt);
    if (d >= visibleDateRange.start && d <= visibleDateRange.end) add(d, 'yellow', item);
  });
  return monthMap;
}

export const useYearView = ({ 
  loadedPeriods, 
  conversations, 
  notes, 
  allContentData, 
  allAnalyticsData, 
  personas 
}: UseYearViewProps) => {
  const { events, visibleDateRange, setVisibleDateRange, setZoomLevel } = useTimelineStore();
  const [modalData, setModalData] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const router = useRouter();
  const hasInitializedDateRange = useRef(false);

  // Get all personas (use passed prop instead of store)
  const allPersonas = personas;

  // YearView relies on store defaults and zoom level changes
  useEffect(() => {
    // Only set zoom level if we're not already in year view
    if (hasInitializedDateRange.current) return;
    
    setZoomLevel('year');
    hasInitializedDateRange.current = true;
  }, []); // Run only once on mount

  // Group data by month/folder for all loaded periods
  const monthMapsByPeriod = useMemo(() => {
    const periodMaps = {};
    
    loadedPeriods.forEach(period => {
      const fullYearRange = { start: period.start, end: period.end };
      periodMaps[period.key] = groupDataByMonth({ 
        conversations, 
        notes, 
        allContentData, 
        allAnalyticsData, 
        visibleDateRange: fullYearRange 
      });
    });
    
    return periodMaps;
  }, [loadedPeriods, conversations, notes, allContentData, allAnalyticsData]);

  // Generate months for all loaded periods
  const allMonthsInPeriods = useMemo(() => {
    const allMonths = [];
    
    loadedPeriods.forEach(period => {
      const months = [];
      const year = period.start.getFullYear();
      
      for (let m = 0; m < 12; m++) {
        months.push(new Date(year, m, 1));
      }
      
      allMonths.push(...months);
    });
    
    return allMonths.sort((a, b) => a.getTime() - b.getTime());
  }, [loadedPeriods]);

  // Generate days for camera-style daily markers for all periods
  const allDaysInPeriods = useMemo(() => {
    const daySet = new Set();
    const allDays = [];
    
    loadedPeriods.forEach(period => {
      const start = new Date(period.start.getFullYear(), 0, 1);
      const end = new Date(period.start.getFullYear(), 11, 31);
      
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

  // Group personas by month for all loaded periods
  const personasInAllPeriods = useMemo(() => {
    if (!allPersonas) return {};
    // Filter personas created in any loaded period
    const personasInRange = allPersonas.filter(persona => {
      const createdDate = new Date(persona.createdAt);
      return loadedPeriods.some(period => {
        return createdDate >= period.start && createdDate <= period.end;
      });
    });
    // Group by month (YYYY-MM)
    const personasByMonth = {};
    personasInRange.forEach(persona => {
      const createdDate = new Date(persona.createdAt);
      const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
      if (!personasByMonth[monthKey]) {
        personasByMonth[monthKey] = [];
      }
      personasByMonth[monthKey].push(persona);
    });
    return personasByMonth;
  }, [allPersonas, loadedPeriods]);

  // Get horizontal position for a persona stack (by month)
  const getPersonaPositionForMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const monthIndex = allMonthsInPeriods.findIndex(m =>
      m.getFullYear() === parseInt(year) && m.getMonth() === parseInt(month) - 1
    );
    if (monthIndex === -1) return 50;
    const position = allMonthsInPeriods.length > 1 ? (monthIndex / (allMonthsInPeriods.length - 1)) * 80 + 10 : 50;
    return Math.max(5, Math.min(95, position));
  };

  // Smart vertical stacking for persona stacks by month
  const getVerticalPosition = (monthKey: string) => {
    const sortedMonths = Object.keys(personasInAllPeriods).sort();
    const monthIndex = sortedMonths.indexOf(monthKey);
    const horizontalPosition = getPersonaPositionForMonth(monthKey);
    const proximityThreshold = 8;
    const conflictingMonths = sortedMonths.filter((otherMonthKey, otherIndex) => {
      if (otherMonthKey === monthKey || otherIndex >= monthIndex) return false;
      const otherPosition = getPersonaPositionForMonth(otherMonthKey);
      return Math.abs(horizontalPosition - otherPosition) < proximityThreshold;
    });
    let isAbove: boolean;
    let verticalOffset: number;
    if (conflictingMonths.length === 0) {
      isAbove = monthIndex % 2 === 0;
      verticalOffset = 0;
    } else {
      const conflictCount = conflictingMonths.length;
      if (conflictCount < 4) {
        isAbove = conflictCount % 2 === 0;
        verticalOffset = Math.floor(conflictCount / 2) * 90;
      } else {
        isAbove = monthIndex % 2 === 0;
        verticalOffset = Math.floor(conflictCount / 3) * 70;
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
  const [activePersonaIndex, setActivePersonaIndex] = useState<{ [monthKey: string]: number }>({});

  // Handle clicking through stacked personas
  const handlePersonaStackClick = (monthKey: string, personasArray: any[]) => {
    if (!personasArray || personasArray.length === 0) return;
    const currentIndex = activePersonaIndex[monthKey] || 0;
    const safeCurrentIndex = Math.max(0, Math.min(currentIndex, personasArray.length - 1));
    const nextIndex = (safeCurrentIndex + 1) % personasArray.length;
    setActivePersonaIndex(prev => ({
      ...prev,
      [monthKey]: nextIndex
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
    monthMapsByPeriod,
    allMonthsInPeriods,
    allDaysInPeriods,
    eventsInAllPeriods,
    personasInAllPeriods,
    folderDotOffsets,
    activePersonaIndex,
    selectedPersona,
    modalData,
    
    // Functions
    getEventPosition,
    getPersonaPositionForMonth,
    getVerticalPosition,
    
    // Handlers
    handlePersonaStackClick,
    handlePersonaClick,
    handleViewFullPersona,
    
    // State setters
    setModalData,
    setSelectedPersona,
  };
}; 