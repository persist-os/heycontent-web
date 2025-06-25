'use client';

import React from 'react';
import { useYearView } from '../hooks/useYearView';
import { TimelineCard } from './TimelineCard';
import { FolderModalManager } from './folders/FolderModalManager';
import { PersonaDetailModal } from './PersonaDetailModal';
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

export const YearView: React.FC<YearViewProps> = ({ 
  loadedPeriods, 
  conversations, 
  notes, 
  allContentData, 
  allAnalyticsData, 
  personas 
}) => {
  const {
    monthMapsByPeriod,
    allDaysInPeriods,
    eventsInAllPeriods,
    personasInAllPeriods,
    folderDotOffsets,
    activePersonaIndex,
    selectedPersona,
    getEventPosition,
    getPersonaPositionForMonth,
    getVerticalPosition,
    handlePersonaStackClick,
    handlePersonaClick,
    handleViewFullPersona,
    setSelectedPersona,
  } = useYearView({ 
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