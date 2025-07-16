'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useTimelineStore } from './useTimelineStore';
import { TimelineCard } from './TimelineCard';

import { getCurrentUserId } from '@/app/lib/api-helpers';
import { useAllPersonas } from '@/store/persona-store';
import { usePersonaTimelineData } from '../hooks/usePersonaTimelineData';
import { FolderModalManager } from './folders/FolderModalManager';
import { PersonaDetailModal } from './PersonaDetailModal';
import { useRouter } from 'next/navigation';
import '../styles/MonthView.css';

// Props interface for MonthView
interface MonthViewProps {
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

export const MonthView: React.FC<MonthViewProps> = ({ 
  loadedPeriods, 
  conversations, 
  notes, 
  allContentData, 
  allAnalyticsData, 
  personas 
}) => {
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

  // Filter personas for all loaded periods (no grouping needed)
  const personasInAllPeriods = useMemo(() => {
    if (!allPersonas) return [];
    
    // Filter personas created in any loaded period
    return allPersonas.filter(persona => {
      const createdDate = new Date(persona.createdAt);
      return loadedPeriods.some(period => {
        return createdDate >= period.start && createdDate <= period.end;
      });
    });
  }, [allPersonas, loadedPeriods]);

  const getPersonaPosition = (persona: any) => {
    const createdDate = new Date(persona.createdAt);
    
    // Find the corresponding day in the allDaysInPeriods array
    const dayInArray = allDaysInPeriods.find(d => 
      d.getFullYear() === createdDate.getFullYear() && 
      d.getMonth() === createdDate.getMonth() && 
      d.getDate() === createdDate.getDate()
    );
    const arrayIndex = allDaysInPeriods.indexOf(dayInArray);
    
    if (arrayIndex === -1) return 50; // Default to center if not found
    
    // Use the exact same positioning logic as the daily ticks
    const position = allDaysInPeriods.length > 1 ? (arrayIndex / (allDaysInPeriods.length - 1)) * 100 : 50;
    return Math.max(5, Math.min(95, position));
  };

  // Simplified vertical positioning - all personas below timeline
  const getVerticalPosition = (personaId: string, persona: any) => {
    // Position all personas consistently below timeline
    return {
      isAbove: false,
      top: -150 // Fixed position below timeline
    };
  };

  // Filter events for all loaded periods
  const eventsInAllPeriods = events.filter(event => {
    return loadedPeriods.some(period => {
      return event.date >= period.start && event.date <= period.end;
    });
  });

  // Simplified state management - no longer needed for individual personas
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
          <div className="timeline-container month-view">
            <div className="timeline-content">
              {/* Camera-style timeline ruler with daily markers */}
              <div className="timeline-ruler-container">
                {/* Main horizontal timeline line */}
                <div className="timeline-main-line"></div>
                
                {/* Daily ticks and labels */}
                <div className="timeline-ruler-content">
                  {allDaysInPeriods.map((day, idx) => {
                    const dayPercent = allDaysInPeriods.length > 1 ? (idx / (allDaysInPeriods.length - 1)) * 100 : 50;
                    const isFirstOfMonth = day.getDate() === 1;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const key = `${day.getFullYear()}-${String(day.getMonth()).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}-${idx}`;
                    const dayKey = day.toISOString().slice(0, 10); // YYYY-MM-DD format to match groupDataByDay
                    
                    // Get folder data from the appropriate period
                    const periodKey = loadedPeriods.find(p => 
                      day >= p.start && day <= p.end
                    )?.key;
                    const dayMap = dayMapsByPeriod[periodKey] || {};
                    const folders = dayMap[dayKey]?.folders || {};
                    const hasData = Object.values(folders).some((folder: any) => folder.count > 0);

                    return (
                      <div key={key} className="timeline-day-container" style={{ left: `${dayPercent}%` }}>
                        {/* Major tick for first of month, minor for others */}
                        <div className={`timeline-tick ${isFirstOfMonth ? 'major' : 'minor'} ${hasData ? 'has-data' : 'no-data'}`} />
                        
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
                              title={`${count} ${folderType} item${count > 1 ? 's' : ''} on ${day.toLocaleDateString()}`}
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
                        
                        {/* Day label below timeline */}
                        <div className={`timeline-day-number ${isFirstOfMonth ? 'major' : ''} ${isWeekend ? 'weekend' : ''}`}>
                          {isFirstOfMonth ? 
                            day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 
                            day.getDate()
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stacked Persona Cards */}
              {personasInAllPeriods.length > 0 && (
                <div className="persona-stacks-container">
                  {personasInAllPeriods.map((persona, index) => {
                    const position = getPersonaPosition(persona);
                    const { isAbove, top } = getVerticalPosition(persona._id, persona);
                    
                    return (
                      <div key={persona._id} className="persona-stack-wrapper">
                        {/* Connecting line from card to timeline */}
                        <div
                          className="absolute w-0.5 bg-muted-foreground/60 z-10"
                          style={{
                            left: `${position}%`,
                            transform: 'translateX(-50%)', // Match timeline tick positioning
                            top: `${top}px`, // Start from persona card
                            height: `${130 - top}px`, // Extend to timeline at 130px
                          }}
                        />
                        {/* Connection dot at the timeline */}
                        <div
                          className="persona-connection-dot"
                          style={{
                            position: 'absolute',
                            left: `${position}%`,
                            transform: 'translateX(-50%)', // Match timeline tick positioning
                            top: `130px`, // Position at timeline level
                            width: '0.75rem',
                            height: '0.75rem',
                            background: 'hsl(var(--foreground))',
                            borderRadius: '50%',
                            border: '2px solid hsl(var(--background))',
                            zIndex: 20,
                            boxShadow: '0 0 0 1px hsl(var(--border))',
                          }}
                        />

                        {/* Stacked persona cards */}
                        <div
                          className="persona-stack"
                          style={{
                            left: `${position}%`,
                            transform: 'translateX(10px)', // Offset cards to the right of the line
                            top: `${top}px`,
                          }}
                        >
                          {/* Active persona card */}
                          <div 
                            className="persona-card-figma-dark"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePersonaClick(persona);
                            }}
                          >
                            {/* Persona name - allow natural wrapping */}
                            <div className="persona-name-figma">
                              {persona.current_name || 'Unnamed Persona'}
                            </div>
                            
                            {/* Achievement/Streak section */}
                            <div className="achievement-badge">
                              <span className="achievement-text">Achievements coming soon</span>
                            </div>
                          </div>
                          
                          {/* Folder bars - positioned lower to accommodate text wrapping */}
                          <div 
                            className="folder-bars"
                            style={{
                              position: 'absolute',
                              top: '140px', // Moved down from 120px to accommodate text wrapping
                              left: '0px',
                              width: '200px',
                            }}
                          >
                            {(() => {
                              const counts = {
                                blue: getFolderCount(persona._id, 'blue'),
                                purple: getFolderCount(persona._id, 'purple'),
                                orange: getFolderCount(persona._id, 'orange'),
                                yellow: getFolderCount(persona._id, 'yellow')
                              };
                              
                              return (
                                <>
                                  <div className="folder-bar blue" style={{ width: '100%' }} onClick={(e) => {
                                    e.stopPropagation();
                                    openModal({
                                      color: 'blue',
                                      count: counts.blue,
                                      items: getFolderItems(persona._id, 'blue')
                                    });
                                  }}>
                                    <Image src="/folders/folder_chat.svg" alt="Chat folder icon" width={16} height={16} className="folder-bar-icon" />
                                    <span className="folder-bar-text">{counts.blue} Conversations</span>
                                  </div>
                                  <div className="folder-bar purple" style={{ width: '100%' }} onClick={(e) => {
                                    e.stopPropagation();
                                    openModal({
                                      color: 'purple',
                                      count: counts.purple,
                                      items: getFolderItems(persona._id, 'purple')
                                    });
                                  }}>
                                    <Image src="/folders/folder_smartnotes.svg" alt="Smart notes folder icon" width={16} height={16} className="folder-bar-icon" />
                                    <span className="folder-bar-text">{counts.purple} SmartNotes</span>
                                  </div>
                                  <div className="folder-bar orange" style={{ width: '100%' }} onClick={(e) => {
                                    e.stopPropagation();
                                    openModal({
                                      color: 'orange',
                                      count: counts.orange,
                                      items: getFolderItems(persona._id, 'orange')
                                    });
                                  }}>
                                    <Image src="/folders/Folder_content.svg" alt="Content folder icon" width={16} height={16} className="folder-bar-icon" />
                                    <span className="folder-bar-text">{counts.orange} Contents</span>
                                  </div>
                                  <div className="folder-bar yellow" style={{ width: '100%' }} onClick={(e) => {
                                    e.stopPropagation();
                                    openModal({
                                      color: 'yellow',
                                      count: counts.yellow,
                                      items: getFolderItems(persona._id, 'yellow')
                                    });
                                  }}>
                                    <Image src="/folders/folder_analytics.svg" alt="Analytics folder icon" width={16} height={16} className="folder-bar-icon" />
                                    <span className="folder-bar-text">{counts.yellow} Analysis</span>
                                  </div>
                                </>
                              );
                            })()}
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