'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useTimelineStore } from './useTimelineStore';
import { TimelineCard } from './TimelineCard';

import { getCurrentUserId } from '@/app/lib/api-helpers';
import { useAllPersonas } from '@/store/persona-store';
import { usePersonaTimelineData } from '../hooks/usePersonaTimelineData';
import { FolderModalManager } from './folders/FolderModalManager';
import { PersonaDetailModal } from './PersonaDetailModal';
import { useRouter } from 'next/navigation';
import '../styles/MonthView.css';

// Props interface for YearView
interface YearViewProps {
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

export const YearView: React.FC<YearViewProps> = ({ 
  loadedPeriods, 
  conversations, 
  notes, 
  allContentData, 
  allAnalyticsData, 
  personas 
}) => {
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

  // Group personas by creation month for all loaded periods
  const personasInAllPeriods = useMemo(() => {
    if (!allPersonas) return {};
    
    // Filter personas created in any loaded period
    const personasInRange = allPersonas.filter(persona => {
      const createdDate = new Date(persona.createdAt);
      return loadedPeriods.some(period => {
        return createdDate >= period.start && createdDate <= period.end;
      });
    });
    
    // Group by month
    const personasByMonth = {};
    personasInRange.forEach(persona => {
      const createdDate = new Date(persona.createdAt);
      const monthKey = `${createdDate.getFullYear()}-${createdDate.getMonth()}`;
      if (!personasByMonth[monthKey]) {
        personasByMonth[monthKey] = [];
      }
      personasByMonth[monthKey].push(persona);
    });
    
    return personasByMonth;
  }, [allPersonas, loadedPeriods]);

  const getPersonaPositionForMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const monthIndex = parseInt(month);
    
    // Find the corresponding month in the allMonthsInPeriods array
    const monthInArray = allMonthsInPeriods.find(m => 
      m.getFullYear() === parseInt(year) && m.getMonth() === monthIndex
    );
    const arrayIndex = allMonthsInPeriods.indexOf(monthInArray);
    
    if (arrayIndex === -1) return 50; // Default to center if not found
    
    // Use the exact same positioning logic as the monthly ticks
    const position = allMonthsInPeriods.length > 1 ? (arrayIndex / (allMonthsInPeriods.length - 1)) * 80 + 10 : 50;
    return Math.max(5, Math.min(95, position));
  };

  // Smart positioning to avoid overlaps
  const getVerticalPosition = (monthKey: string) => {
    const sortedMonths = Object.keys(personasInAllPeriods).sort();
    const monthIndex = sortedMonths.indexOf(monthKey);
    
    // Get horizontal position for this month
    const horizontalPosition = getPersonaPositionForMonth(monthKey);
    
    // Check for horizontal proximity conflicts with other cards
    const proximityThreshold = 8;
    const conflictingMonths = sortedMonths.filter((otherMonthKey, otherIndex) => {
      if (otherMonthKey === monthKey || otherIndex >= monthIndex) return false;
      const otherPosition = getPersonaPositionForMonth(otherMonthKey);
      return Math.abs(horizontalPosition - otherPosition) < proximityThreshold;
    });
    
    // Determine positioning based on conflicts and index
    let isAbove: boolean;
    let verticalOffset: number;
    
    if (conflictingMonths.length === 0) {
      // No conflicts, use simple alternating
      isAbove = monthIndex % 2 === 0;
      verticalOffset = 0;
    } else {
      // Have conflicts, need smarter positioning
      const conflictCount = conflictingMonths.length;
      
      if (conflictCount < 4) {
        isAbove = conflictCount % 2 === 0;
        verticalOffset = Math.floor(conflictCount / 2) * 90;
      } else {
        // For many conflicts, use both sides
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
  const [activePersonaIndex, setActivePersonaIndex] = useState<{ [dayKey: string]: number }>({});

  // Handle clicking through stacked personas
  const handlePersonaStackClick = (dayKey: string, personasArray: any[]) => {
    if (!personasArray || personasArray.length === 0) return;
    
    const currentIndex = activePersonaIndex[dayKey] || 0;
    const safeCurrentIndex = Math.max(0, Math.min(currentIndex, personasArray.length - 1));
    const nextIndex = (safeCurrentIndex + 1) % personasArray.length;
    
    setActivePersonaIndex(prev => ({
      ...prev,
      [dayKey]: nextIndex
    }));
  };

  const handlePersonaClick = (persona: any) => {
    setSelectedPersona(persona);
  };

  const handleViewFullPersona = () => {
    setSelectedPersona(null);
    router.push('/dashboard/self-hub?tab=persona');
  };

  return (
    <>
      <FolderModalManager>
        {(openModal) => (
          <div className="timeline-container year-view">
            <div className="timeline-content">
              {/* Camera-style timeline ruler with monthly and daily markers */}
              <div className="timeline-ruler-container">
                {/* Main horizontal timeline line */}
                <div className="timeline-main-line"></div>
                
                {/* Monthly major ticks and daily minor ticks */}
                <div className="timeline-ruler-content">
                  {allDaysInPeriods.map((day, idx) => {
                    const dayPercent = allDaysInPeriods.length > 1 ? (idx / (allDaysInPeriods.length - 1)) * 100 : 50;
                    const isFirstOfMonth = day.getDate() === 1;
                    const isMidMonth = day.getDate() === 15;
                    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${idx}`;
                    const monthKey = `${day.getFullYear()}-${day.getMonth()}`;
                    
                    // Get folder data from the appropriate period
                    const matchingPeriod = loadedPeriods.find(p => 
                      day.getFullYear() === p.start.getFullYear()
                    );
                    const periodKey = matchingPeriod ? matchingPeriod.key : '';
                    const monthMap = monthMapsByPeriod[periodKey] || {};
                    const folders = monthMap[monthKey]?.folders || {};
                    const hasData = Object.values(folders).some((folder: any) => folder.count > 0);

                    return (
                      <div key={key} className="timeline-day-container" style={{ left: `${dayPercent}%` }}>
                        {isFirstOfMonth ? (
                          <>
                            {/* Major tick for month */}
                            <div className={`timeline-tick major ${hasData ? 'has-data' : 'no-data'}`} />
                            {/* Vertical lines connecting to folder dots */}
                            {(['blue', 'purple', 'orange', 'yellow'] as const).map(folderType => {
                              const count = folders[folderType]?.count || 0;
                              if (count === 0) return null;
                              return (
                                <div 
                                  key={`line-${folderType}`}
                                  className="timeline-vertical-line"
                                  style={{
                                    height: `${folderDotOffsets[folderType]}px`,
                                  }} 
                                />
                              );
                            })}
                            {/* Colored folder dots stacked above timeline */}
                            {(['blue', 'purple', 'orange', 'yellow'] as const).map(folderType => {
                              const count = folders[folderType]?.count || 0;
                              if (count === 0) return null;
                              return (
                                <div
                                  key={folderType}
                                  className={`timeline-folder-dot ${folderType}`}
                                  title={`${count} ${folderType} item${count > 1 ? 's' : ''} in ${day.toLocaleDateString('en-US', { month: 'short' })}`}
                                  onClick={() => openModal({
                                    color: folderType,
                                    count,
                                    items: folders[folderType].items
                                  })}
                                >
                                  {/* Only show badge if more than 1 item */}
                                  {count > 1 && (
                                    <span className="timeline-dot-badge">
                                      {count}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            {/* Month name below timeline */}
                            <div className="timeline-day-number major">
                              {day.toLocaleDateString('en-US', { month: 'short' })}
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Minor tick for day */}
                            <div className="timeline-tick minor has-data" />
                            {/* Show day number only for mid-month */}
                            {isMidMonth && (
                              <div className="timeline-day-number" style={{ fontSize: '0.7rem' }}>
                                {day.getDate()}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stacked Persona Cards */}
              {Object.keys(personasInAllPeriods).length > 0 && (
                <div className="persona-stacks-container">
                  {Object.entries(personasInAllPeriods).map(([monthKey, personas]) => {
                    const position = getPersonaPositionForMonth(monthKey);
                    const personasArray = personas as any[];
                    const activeIndex = activePersonaIndex[monthKey] || 0;
                    const currentPersona = personasArray[activeIndex];
                    const { isAbove, top } = getVerticalPosition(monthKey);
                    
                    if (personasArray.length === 0) return null;
                    
                    return (
                      <div key={monthKey} className="persona-stack-wrapper">
                        {/* Connection dot on timeline */}
                        <div
                          className="persona-connection-dot"
                          style={{
                            left: `${position}%`,
                          }}
                        />
                        
                        {/* Connecting line from card to timeline */}
                        <div
                          className="absolute w-0.5 bg-muted-foreground/60 z-10"
                          style={{
                            left: `${position}%`,
                            transform: 'translateX(-50%)',
                            top: isAbove ? `${120 + top}px` : `120px`,
                            height: isAbove ? `${Math.abs(top)}px` : `${top - 120}px`,
                          }}
                        />

                        {/* Stacked persona cards */}
                        <div
                          className="persona-stack"
                          style={{
                            left: `${position}%`,
                            transform: 'translateX(-50%)',
                            top: `${top}px`,
                          }}
                        >
                          {/* Background cards (for stack effect) */}
                          {personasArray.length > 1 && (
                            <>
                              {Array.from({ length: Math.min(personasArray.length - 1, 4) }, (_, index) => (
                                <div 
                                  key={`stack-bg-${index}`}
                                  className={`persona-stack-bg persona-stack-bg-${Math.min(index + 1, 3)}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePersonaStackClick(monthKey, personasArray);
                                  }}
                                  title="Click to cycle through personas"
                                />
                              ))}
                            </>
                          )}
                          
                          {/* Active persona card */}
                          <div 
                            className="persona-card"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePersonaClick(currentPersona);
                            }}
                          >
                            <div className="persona-creation-date">
                              {new Date(currentPersona.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                year: '2-digit' 
                              })}
                            </div>
                            <div className="persona-name">
                              {currentPersona.current_name || 'Unnamed Persona'}
                            </div>
                            
                            {/* Stack indicator */}
                            {personasArray.length > 1 && (
                              <div 
                                className="persona-stack-indicator"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePersonaStackClick(monthKey, personasArray);
                                }}
                              >
                                {activeIndex + 1} / {personasArray.length}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Events with expanded cards */}
              <div className="events-container" style={{ paddingBottom: `${eventsInAllPeriods.length * 120 + 100}px` }}>
                {eventsInAllPeriods.map((event, index) => {
                  const position = getEventPosition(event.date);
                  const isEven = index % 2 === 0;
                  
                  return (
                    <div
                      key={event.id}
                      className="event-wrapper"
                      style={{ 
                        top: `${index * 120}px`,
                      }}
                    >
                      {/* Connecting line to timeline */}
                      <div 
                        className="event-connecting-line"
                        style={{ 
                          left: `${position}%`,
                        }}
                      ></div>
                      
                      {/* Event marker on timeline */}
                      <div 
                        className="event-marker"
                        style={{ 
                          left: `${position}%`,
                        }}
                      ></div>
                      
                      {/* Event card */}
                      <div 
                        className={`event-card-wrapper ${isEven ? 'even' : 'odd'}`}
                        style={{
                          left: isEven ? `${Math.max(5, position - 20)}%` : 'auto',
                          right: isEven ? 'auto' : `${Math.max(5, 100 - position - 20)}%`,
                        }}
                      >
                        <TimelineCard event={event} variant="expanded" />
                      </div>
                      
                      {/* Date label */}
                      <div 
                        className="event-date-label text-muted-foreground"
                        style={{ 
                          left: `${position}%`,
                        }}
                      >
                        {event.date.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}
      </FolderModalManager>

      {/* Persona Detail Modal */}
      {selectedPersona && (
        <PersonaDetailModal
          persona={selectedPersona}
          onClose={() => setSelectedPersona(null)}
          onViewFull={handleViewFullPersona}
        />
      )}
    </>
  );
}; 