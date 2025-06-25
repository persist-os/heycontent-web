'use client';

import React from 'react';
import { useMonthView } from '../hooks/useMonthView';
import { TimelineCard } from './TimelineCard';
import { FolderModalManager } from './folders/FolderModalManager';
import { PersonaDetailModal } from './PersonaDetailModal';
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

// Interface for persona bucket data (mirrored from hook)
interface PersonaBucketData {
  personas: any[];
  startDay: number;
  endDay: number;
  month: number;
  year: number;
}

export const MonthView: React.FC<MonthViewProps> = ({ 
  loadedPeriods, 
  conversations, 
  notes, 
  allContentData, 
  allAnalyticsData, 
  personas 
}) => {
  const {
    dayMapsByPeriod,
    allDaysInPeriods,
    eventsInAllPeriods,
    personasInAllPeriods,
    folderDotOffsets,
    activePersonaIndex,
    selectedPersona,
    getEventPosition,
    getPersonaPositionForBucket,
    getVerticalPosition,
    handlePersonaStackClick,
    handlePersonaClick,
    handleViewFullPersona,
    setSelectedPersona,
  } = useMonthView({ 
    loadedPeriods, 
    conversations, 
    notes, 
    allContentData, 
    allAnalyticsData, 
    personas 
  });

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
              {Object.keys(personasInAllPeriods).length > 0 && (
                <div className="persona-stacks-container">
                  {Object.entries(personasInAllPeriods).map(([bucketKey, bucketData]) => {
                    const typedBucketData = bucketData as PersonaBucketData;
                    const position = getPersonaPositionForBucket(bucketKey, typedBucketData);
                    const personasArray = typedBucketData.personas;
                    const activeIndex = activePersonaIndex[bucketKey] || 0;
                    const currentPersona = personasArray[activeIndex];
                    const { isAbove, top } = getVerticalPosition(bucketKey, typedBucketData);
                    
                    if (personasArray.length === 0) return null;
                    
                    return (
                      <div key={bucketKey} className="persona-stack-wrapper">
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
                                    handlePersonaStackClick(bucketKey, personasArray);
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
                                day: 'numeric' 
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
                                  handlePersonaStackClick(bucketKey, personasArray);
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