'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useTimelineStore } from './useTimelineStore';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Calendar, User, Sparkles } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';
import { FolderModalManager, FolderData } from './folders';
import { PersonaDetailModal } from './PersonaDetailModal';

// Props interface for RoadmapView
interface RoadmapViewProps {
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
  getFolderCount: (personaId: string, folderType: 'blue' | 'purple' | 'orange' | 'yellow') => number;
  getFolderItems: (personaId: string, folderType: 'blue' | 'purple' | 'orange' | 'yellow') => any[];
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ 
  loadedPeriods, 
  conversations, 
  notes, 
  allContentData, 
  allAnalyticsData, 
  personas,
  getFolderCount,
  getFolderItems
}) => {
  const { visibleDateRange, setVisibleDateRange } = useTimelineStore();
  const [userId, setUserId] = useState<string | undefined>();
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activePersonaIndex, setActivePersonaIndex] = useState<{ [dateKey: string]: number }>({});
  const router = useRouter();

  // Get user ID from API key in cookies
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    setUserId(currentUserId || undefined);
  }, []);

  // Use personas from props
  const allPersonas = personas;

  const formatDate = (date: Date) => {
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const ordinal = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
    return `${month} ${day}${ordinal}`;
  };

  const getPersonaPosition = (index: number, total: number) => {
    if (total <= 1) return 50;
    return 15 + (index / Math.max(1, total - 1)) * 70;
  };

  const handlePersonaClick = (persona: any) => {
    setSelectedPersona(persona);
  };

  const handleViewFullPersona = () => {
    setSelectedPersona(null);
    router.push('/dashboard/self-hub?tab=persona');
  };

  // Handle clicking through stacked personas on the same day
  const handlePersonaStackClick = (dateKey: string, personasArray: any[]) => {
    if (!personasArray || personasArray.length === 0) return;
    
    const currentIndex = activePersonaIndex[dateKey] || 0;
    const safeCurrentIndex = Math.max(0, Math.min(currentIndex, personasArray.length - 1));
    const nextIndex = (safeCurrentIndex + 1) % personasArray.length;
    
    setActivePersonaIndex(prev => ({
      ...prev,
      [dateKey]: nextIndex
    }));
  };

  const getPersonaCreationDate = (persona: any) => {
    return new Date(persona.createdAt);
  };

  // Sort personas by creation date and group by day
  const allSortedPersonas = allPersonas ? [...allPersonas].sort((a, b) => a.createdAt - b.createdAt) : [];
  
  // Filter personas for all loaded periods (like MonthView/YearView)
  const personasInLoadedPeriods = useMemo(() => {
    if (!allPersonas) return [];
    
    // Filter personas created in any loaded period
    return allPersonas.filter(persona => {
      const createdDate = new Date(persona.createdAt);
      return loadedPeriods.some(period => {
        return createdDate >= period.start && createdDate <= period.end;
      });
    });
  }, [allPersonas, loadedPeriods]);

  // Group personas by creation date (day)
  const personasByDate = useMemo(() => {
    const grouped = {};
    personasInLoadedPeriods.forEach(persona => {
      const creationDate = new Date(persona.createdAt);
      const dateKey = creationDate.toISOString().slice(0, 10); // YYYY-MM-DD format
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(persona);
    });
    return grouped;
  }, [personasInLoadedPeriods]);

  // Always show all personas, don't filter by date range to prevent data disappearing
  const sortedPersonas = allSortedPersonas;

  // Generate all days in loaded periods for timeline (like MonthView/YearView)
  const allDaysInRange = useMemo(() => {
    const daySet = new Set();
    const allDays = [];
    
    loadedPeriods.forEach(period => {
      const start = new Date(period.start);
      const end = new Date(period.end);
      
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

  // If no personas available at all
  const hasPersonasInRange = personasInLoadedPeriods.length > 0;

  // No user state
  if (!userId) {
    return (
      <div className="min-h-screen bg-background pb-32 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm p-8 rounded-xl bg-muted/50">
          <p className="text-muted-foreground text-sm leading-relaxed">
            Please sign in to view your persona roadmap
          </p>
        </div>
      </div>
    );
  }

  // No personas at all state
  if (!personasInLoadedPeriods || personasInLoadedPeriods.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-6 max-w-md p-8">
            <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Personas Yet</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Create your first AI content persona to start building your roadmap
              </p>
            </div>
            <Button
              onClick={() => router.push('/dashboard/chat?ask=hey%20content%20persona')}
              className="bg-primary hover:bg-primary/90"
            >
              Create Your First Persona
            </Button>
          </div>
        </div>
      
      </div>
    );
  }

  return (
    <FolderModalManager>
      {(openModal) => (
        <>
          <div className="min-h-screen bg-background">
            {/* Main Content Area */}
            <div className="px-8 py-4">
              {/* Complete Timeline Container */}
              <div className="relative" style={{ height: '450px' }}>
                
                {/* Stacked Persona Cards by Date */}
                {Object.entries(personasByDate).map(([dateKey, personasOnDate], groupIndex) => {
                  // Type guard to ensure personasOnDate is an array
                  const personasArray = Array.isArray(personasOnDate) ? personasOnDate : [];
                  
                  // Find the exact day position for this persona group (same as dots)
                  const dayIndex = allDaysInRange.findIndex(day => 
                    day.toISOString().slice(0, 10) === dateKey
                  );
                  
                  if (dayIndex === -1) return null; // Date not in visible range
                  
                  const position = allDaysInRange.length > 1 ? (dayIndex / (allDaysInRange.length - 1)) * 100 : 50;
                  const isAbove = groupIndex % 2 === 0; // Alternate above and below
                  const cardTop = isAbove ? 60 : 320; // Position above or below lowered road
                  const activeIndex = activePersonaIndex[dateKey] || 0;
                  const currentPersona = personasArray[activeIndex];
                  const cardHeight = expandedCard === currentPersona._id ? 120 : 100;
                  
                  return (
                    <div key={dateKey}>
                      {/* Persona Stack */}
                      <div
                        className="absolute"
                        style={{ 
                          left: `${position}%`,
                          transform: 'translateX(-50%)',
                          top: `${cardTop}px`,
                        }}
                      >
                        {/* Background cards for stack effect */}
                        {personasArray.length > 1 && (
                          <>
                            {Array.from({ length: Math.min(personasArray.length - 1, 3) }, (_, index) => (
                              <div 
                                key={`stack-bg-${index}`}
                                className="absolute bg-card rounded-lg border border-border shadow-sm cursor-pointer"
                                style={{
                                  width: '192px', // w-48 equivalent
                                  height: '100px',
                                  top: `${(index + 1) * 2}px`,
                                  left: `${(index + 1) * 2}px`,
                                  zIndex: Math.max(0, 3 - index),
                                  opacity: 0.7 - (index * 0.2)
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePersonaStackClick(dateKey, personasArray);
                                }}
                                title="Click to cycle through personas"
                              />
                            ))}
                          </>
                        )}

                        {/* Active persona card */}
                        <div 
                          className={`bg-card rounded-lg border border-border shadow-md hover:shadow-xl transition-all duration-500 cursor-pointer group hover:border-primary/30 overflow-hidden relative z-10 ${
                            expandedCard === currentPersona._id ? 'w-96' : 'w-48'
                          }`}
                          onMouseEnter={() => setExpandedCard(currentPersona._id)}
                          onMouseLeave={() => setExpandedCard(null)}
                          onClick={() => {
                            setExpandedCard(expandedCard === currentPersona._id ? null : currentPersona._id);
                          }}
                        >
                          <div className="flex h-full">
                            {/* Left Section - Always Visible */}
                            <div className="p-3 w-48 flex-shrink-0 flex flex-col justify-center">
                              <div className="text-center">
                                <div className="text-lg font-bold text-foreground mb-3">
                                  {currentPersona.current_name || 'Unnamed Persona'}
                                </div>
                                
                                {/* Stack indicator */}
                                {personasArray.length > 1 && (
                                  <div 
                                    className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-1 cursor-pointer hover:bg-muted/80 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePersonaStackClick(dateKey, personasArray);
                                    }}
                                    title="Click to cycle through personas"
                                  >
                                    {activeIndex + 1} / {personasArray.length}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Section - Expandable */}
                            <div 
                              className={`transition-all duration-500 overflow-hidden border-l border-border/30 ${
                                expandedCard === currentPersona._id ? 'w-48 opacity-100' : 'w-0 opacity-0'
                              }`}
                            >
                              <div className="p-3 w-48">
                                {/* Description Preview */}
                                <div className="mb-3">
                                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                    {currentPersona.current_description || 'No description available'}
                                  </p>
                                </div>
                                
                                {/* Actions */}
                                <div>
                                  <Button
                                    size="sm"
                                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 mb-2 text-xs py-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePersonaClick(currentPersona);
                                    }}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View Details
                                  </Button>
                                  
                                  {/* Folder Icons with Real Data */}
                                  <div className="flex space-x-1 justify-center">
                                    {[
                                      { color: 'blue' as const, count: getFolderCount(currentPersona._id, 'blue'), src: '/folders/folder_chat.svg' },
                                      { color: 'purple' as const, count: getFolderCount(currentPersona._id, 'purple'), src: '/folders/folder_smartnotes.svg' },
                                      { color: 'orange' as const, count: getFolderCount(currentPersona._id, 'orange'), src: '/folders/Folder_content.svg' },
                                      { color: 'yellow' as const, count: getFolderCount(currentPersona._id, 'yellow'), src: '/folders/folder_analytics.svg' },
                                    ].map((folder, idx) => (
                                      <div 
                                        key={idx} 
                                        className="relative group/folder hover:scale-110 transition-transform cursor-pointer"
                                        title={`${folder.color} folder - ${folder.count} items`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const folderItems = getFolderItems(currentPersona._id, folder.color);
                                          openModal({ 
                                            color: folder.color, 
                                            count: folder.count,
                                            items: folderItems,
                                            personaId: currentPersona._id
                                          });
                                        }}
                                      >
                                        <Image
                                          src={folder.src}
                                          alt={`${folder.color} folder icon`}
                                          width={24}
                                          height={24}
                                          className="w-6 h-6 object-contain"
                                        />
                                        {folder.count > 0 && (
                                          <span className="absolute -top-1 -right-1 text-xs bg-primary text-primary-foreground rounded-full w-3 h-3 flex items-center justify-center text-[8px] font-bold border border-background">
                                            {folder.count}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Colorful dots outside card with real data - only when collapsed */}
                      {expandedCard !== currentPersona._id && (
                        <div 
                          className="absolute flex flex-col space-y-2 z-30"
                          style={{
                            left: `${position}%`,
                            transform: 'translateX(108px) translateY(-50%)',
                            top: `${cardTop + cardHeight / 2}px`,
                          }}
                        >
                          {[
                            { color: '#3B82F6', shadow: '0 0 8px rgba(59, 130, 246, 0.6)', folderType: 'blue' as const },
                            { color: '#8B5CF6', shadow: '0 0 8px rgba(139, 92, 246, 0.6)', folderType: 'purple' as const },
                            { color: '#F97316', shadow: '0 0 8px rgba(249, 115, 22, 0.6)', folderType: 'orange' as const },
                            { color: '#EAB308', shadow: '0 0 8px rgba(234, 179, 8, 0.6)', folderType: 'yellow' as const },
                          ]
                          .filter(folder => getFolderCount(currentPersona._id, folder.folderType) > 0)
                          .map((folder, idx) => {
                            const count = getFolderCount(currentPersona._id, folder.folderType);
                            return (
                              <div 
                                key={folder.folderType} 
                                className="w-4 h-4 rounded-full cursor-pointer hover:scale-125 transition-all duration-200 relative"
                                style={{ 
                                  backgroundColor: folder.color,
                                  boxShadow: folder.shadow
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const folderItems = getFolderItems(currentPersona._id, folder.folderType);
                                  openModal({ 
                                    color: folder.folderType, 
                                    count: count,
                                    items: folderItems,
                                    personaId: currentPersona._id
                                  });
                                }}
                              >
                                <span className="absolute -top-1 -right-1 text-xs bg-white text-black rounded-full w-3 h-3 flex items-center justify-center text-[8px] font-bold">
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Connecting line from under card to road */}
                      <div
                        className="absolute w-0.5 bg-muted-foreground/80 z-10"
                        style={{
                          left: `${position}%`,
                          transform: 'translateX(-50%)',
                          top: isAbove ? `${cardTop + cardHeight + 8}px` : `282px`, // Bigger gap for top cards
                          height: isAbove ? `${282 - (cardTop + cardHeight + 8)}px` : `${cardTop - 282 - 8}px`, // Adjusted calculations
                        }}
                      />
                    </div>
                  );
                })}

                {/* Road Section - Positioned in center */}
                <div 
                  className="absolute left-0 right-0 z-20"
                  style={{ top: '280px' }} // Much lower position
                >
                  {/* Road base - no background */}
                  <div className="w-full h-3 relative">
                    {/* White edge lines - much further apart */}
                    <div className="absolute left-0 right-0 h-0.5" style={{ backgroundColor: '#E5E7EB', top: '-8px' }} />
                    <div className="absolute left-0 right-0 h-0.5" style={{ backgroundColor: '#E5E7EB', bottom: '-8px' }} />
                    
                    {/* Yellow dashed center line */}
                    <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2">
                      <div 
                        className="w-full h-0.5"
                        style={{
                          background: `repeating-linear-gradient(
                            to right,
                            #FDE047 0px,
                            #FDE047 20px,
                            transparent 20px,
                            transparent 50px
                          )`
                        }}
                      />
                    </div>
                  </div>

                  {/* Day labels below road */}
                  {allDaysInRange.map((day, index) => {
                    const dayPercent = allDaysInRange.length > 1 ? (index / (allDaysInRange.length - 1)) * 100 : 50;
                    const isMonday = day.getDay() === 1;
                    const isFirstOfMonth = day.getDate() === 1;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    
                    // Show day of week for Mondays, date for first of month, or day number for others
                    const getLabel = () => {
                      if (isFirstOfMonth) {
                        return day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      } else if (isMonday) {
                        return day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
                      } else {
                        return day.getDate().toString();
                      }
                    };
                    
                    return (
                      <div
                        key={`day-label-${day.toISOString().slice(0, 10)}`}
                        className={`absolute text-xs whitespace-nowrap ${
                          isMonday ? 'font-semibold text-yellow-400' : 
                          isFirstOfMonth ? 'font-medium text-foreground' :
                          isWeekend ? 'text-muted-foreground/70' : 'text-muted-foreground'
                        }`}
                        style={{
                          left: `${dayPercent}%`,
                          transform: 'translateX(-50%)',
                          top: '20px',
                        }}
                      >
                        {getLabel()}
                      </div>
                    );
                  })}

                  {/* Big glowing yellow dots on days with personas */}
                  {Object.entries(personasByDate).map(([dateKey, personasArray], groupIndex) => {
                    // Find the day position for this persona group
                    const personaDate = new Date(dateKey);
                    const dayIndex = allDaysInRange.findIndex(day => 
                      day.toISOString().slice(0, 10) === dateKey
                    );
                    
                    if (dayIndex === -1) return null; // Date not in visible range
                    
                    const dayPercent = allDaysInRange.length > 1 ? (dayIndex / (allDaysInRange.length - 1)) * 100 : 50;
                    
                    return (
                      <div key={`milestone-${dateKey}`}>
                        {/* Big glowing yellow dot in middle of road */}
                        <div
                          className="absolute z-30"
                          style={{ 
                            left: `${dayPercent}%`,
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          <div 
                            className="w-6 h-6 rounded-full relative animate-pulse" 
                            style={{ 
                              backgroundColor: '#FDE047', 
                              boxShadow: '0 0 20px #FDE047, 0 0 40px #FDE047, 0 0 60px #FDE047',
                              border: '2px solid #FBBF24'
                            }}
                          >
                            {/* Glowing effect */}
                            <div 
                              className="absolute inset-0 rounded-full animate-ping opacity-75" 
                              style={{ backgroundColor: '#FDE047' }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
      

            {/* Persona Detail Modal */}
            {selectedPersona && (
              <PersonaDetailModal
                persona={selectedPersona}
                onClose={() => setSelectedPersona(null)}
                onViewFull={handleViewFullPersona}
              />
            )}
          </div>
        </>
      )}
    </FolderModalManager>
  );
}; 