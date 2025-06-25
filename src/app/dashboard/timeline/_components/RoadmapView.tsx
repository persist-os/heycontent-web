'use client';

import React, { useEffect, useState } from 'react';
import { useTimelineStore } from './useTimelineStore';
import { TimelineControls } from './TimelineControls';
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
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ 
  loadedPeriods, 
  conversations, 
  notes, 
  allContentData, 
  allAnalyticsData, 
  personas 
}) => {
  const { visibleDateRange, setVisibleDateRange } = useTimelineStore();
  const [userId, setUserId] = useState<string | undefined>();
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const router = useRouter();

  // Get user ID from API key in cookies
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    setUserId(currentUserId || undefined);
  }, []);

  // Use personas from props
  const allPersonas = personas;

  // Helper functions to get folder data from props
  const getFolderCount = (personaId: string, folderType: 'blue' | 'purple' | 'orange' | 'yellow') => {
    switch (folderType) {
      case 'blue': // conversations
        return conversations.filter(conv => conv.personaId === personaId).length;
      case 'purple': // notes
        return notes.filter(note => note.personaId === personaId).length;
      case 'orange': // content
        return allContentData.filter(item => item.personaId === personaId).length;
      case 'yellow': // analytics
        return allAnalyticsData.filter(item => item.personaId === personaId).length;
      default:
        return 0;
    }
  };

  const getFolderItems = (personaId: string, folderType: 'blue' | 'purple' | 'orange' | 'yellow') => {
    switch (folderType) {
      case 'blue': // conversations
        return conversations.filter(conv => conv.personaId === personaId);
      case 'purple': // notes
        return notes.filter(note => note.personaId === personaId);
      case 'orange': // content
        return allContentData.filter(item => item.personaId === personaId);
      case 'yellow': // analytics
        return allAnalyticsData.filter(item => item.personaId === personaId);
      default:
        return [];
    }
  };

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

  const getPersonaCreationDate = (persona: any) => {
    return new Date(persona.createdAt);
  };

  // Sort personas by creation date - always show all available personas
  const allSortedPersonas = allPersonas ? [...allPersonas].sort((a, b) => a.createdAt - b.createdAt) : [];
  
  // Always show all personas, don't filter by date range to prevent data disappearing
  const sortedPersonas = allSortedPersonas;

  // If no personas available at all
  const hasPersonasInRange = sortedPersonas.length > 0;

  // Auto-snap to available data: if we have personas, adjust visible date range to include them
  useEffect(() => {
    if (sortedPersonas.length > 0) {
      const personaDates = sortedPersonas.map(p => new Date(p.createdAt));
      const minDate = new Date(Math.min(...personaDates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...personaDates.map(d => d.getTime())));
      
      // Expand the range slightly to provide padding
      const padding = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      const expandedMinDate = new Date(minDate.getTime() - padding);
      const expandedMaxDate = new Date(maxDate.getTime() + padding);
      
      // Only update if the current range doesn't contain all personas
      if (visibleDateRange.start > expandedMinDate || visibleDateRange.end < expandedMaxDate) {
        setVisibleDateRange(expandedMinDate, expandedMaxDate);
      }
    }
  }, [sortedPersonas, visibleDateRange, setVisibleDateRange]);


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
  if (!allPersonas || allPersonas.length === 0) {
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
                
                {/* Persona Cards */}
                {sortedPersonas.map((persona, index) => {
                  const position = getPersonaPosition(index, sortedPersonas.length);
                  const isAbove = index % 2 === 0; // Alternate above and below
                  const cardTop = isAbove ? 20 : 300; // Position above or below road with more spacing
                  const cardHeight = expandedCard === persona._id ? 120 : 100; // Dynamic card height based on expansion
                  
                  return (
                    <div key={persona._id}>
                      {/* Persona Card */}
                      <div
                        className="absolute"
                        style={{ 
                          left: `${position}%`,
                          transform: 'translateX(-50%)',
                          top: `${cardTop}px`,
                        }}
                      >
                        <div 
                          className={`bg-card rounded-lg border border-border shadow-md hover:shadow-xl transition-all duration-500 cursor-pointer group hover:border-primary/30 overflow-hidden ${
                            expandedCard === persona._id ? 'w-96' : 'w-48'
                          }`}
                          onMouseEnter={() => setExpandedCard(persona._id)}
                          onMouseLeave={() => setExpandedCard(null)}
                          onClick={() => {
                            setExpandedCard(expandedCard === persona._id ? null : persona._id);
                          }}
                        >
                                                      <div className="flex h-full">
                              {/* Left Section - Always Visible */}
                              <div className="p-3 w-48 flex-shrink-0 flex flex-col justify-center">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-foreground mb-3">
                                    {persona.current_name || 'Unnamed Persona'}
                                  </div>
                                </div>
                              </div>

                            {/* Right Section - Expandable */}
                            <div 
                              className={`transition-all duration-500 overflow-hidden border-l border-border/30 ${
                                expandedCard === persona._id ? 'w-48 opacity-100' : 'w-0 opacity-0'
                              }`}
                            >
                              <div className="p-3 w-48">
                                {/* Description Preview */}
                                <div className="mb-3">
                                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                    {persona.current_description || 'No description available'}
                                  </p>
                                </div>
                                
                                {/* Actions */}
                                <div>
                                  <Button
                                    size="sm"
                                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 mb-2 text-xs py-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePersonaClick(persona);
                                    }}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View Details
                                  </Button>
                                  
                                  {/* Folder Icons with Real Data */}
                                  <div className="flex space-x-1 justify-center">
                                    {[
                                      { color: 'blue' as const, count: getFolderCount(persona._id, 'blue'), src: '/folders/folder_chat.svg' },
                                      { color: 'purple' as const, count: getFolderCount(persona._id, 'purple'), src: '/folders/folder_smartnotes.svg' },
                                      { color: 'orange' as const, count: getFolderCount(persona._id, 'orange'), src: '/folders/Folder_content.svg' },
                                      { color: 'yellow' as const, count: getFolderCount(persona._id, 'yellow'), src: '/folders/folder_analytics.svg' },
                                    ].map((folder, idx) => (
                                      <div 
                                        key={idx} 
                                        className="relative group/folder hover:scale-110 transition-transform cursor-pointer"
                                        title={`${folder.color} folder - ${folder.count} items`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const folderItems = getFolderItems(persona._id, folder.color);
                                          openModal({ 
                                            color: folder.color, 
                                            count: folder.count,
                                            items: folderItems,
                                            personaId: persona._id
                                          });
                                        }}
                                      >
                                        <img
                                          src={folder.src}
                                          alt={`${folder.color} folder`}
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
                      {expandedCard !== persona._id && (
                        <div 
                          className="absolute flex flex-col space-y-2 z-30"
                          style={{
                            left: `${position}%`,
                            transform: 'translateX(108px) translateY(-50%)',
                            top: `${cardTop + cardHeight / 2}px`,
                          }}
                        >
                          {[
                            { color: '#3B82F6', shadow: '0 0 8px rgba(59, 130, 246, 0.6)', folderType: 'blue' as const }, // blue
                            { color: '#8B5CF6', shadow: '0 0 8px rgba(139, 92, 246, 0.6)', folderType: 'purple' as const }, // purple  
                            { color: '#F97316', shadow: '0 0 8px rgba(249, 115, 22, 0.6)', folderType: 'orange' as const }, // orange
                            { color: '#EAB308', shadow: '0 0 8px rgba(234, 179, 8, 0.6)', folderType: 'yellow' as const }, // yellow
                          ]
                          .filter(folder => getFolderCount(persona._id, folder.folderType) > 0) // Only show dots with data
                          .map((folder, idx) => {
                            const count = getFolderCount(persona._id, folder.folderType);
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
                                  const folderItems = getFolderItems(persona._id, folder.folderType);
                                  openModal({ 
                                    color: folder.folderType, 
                                    count: count,
                                    items: folderItems,
                                    personaId: persona._id
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

                      {/* Connecting line from card to road */}
                      <div
                        className="absolute w-0.5 bg-muted-foreground/60 z-10"
                        style={{
                          left: `${position}%`,
                          transform: 'translateX(-50%)',
                          top: isAbove ? `${cardTop + cardHeight}px` : `212px`, // Start from card edge or road bottom
                          height: isAbove ? `${200 - (cardTop + cardHeight)}px` : `${cardTop - 212}px`,
                        }}
                      />
                    </div>
                  );
                })}

                {/* Road Section - Positioned in center */}
                <div 
                  className="absolute left-0 right-0 z-20"
                  style={{ top: '200px' }} // Centered between cards
                >
                  {/* Road base - gray background */}
                  <div className="w-full h-6 bg-gray-600 relative">
                    {/* Yellow dashed road line */}
                    <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2">
                      <div 
                        className="w-full h-1"
                        style={{
                          background: `repeating-linear-gradient(
                            to right,
                            #fbbf24 0px,
                            #fbbf24 30px,
                            transparent 30px,
                            transparent 50px
                          )`
                        }}
                      />
                    </div>
                  </div>

                  {/* Milestone points and dates */}
                  {sortedPersonas.map((persona, index) => {
                    const position = getPersonaPosition(index, sortedPersonas.length);
                    const creationDate = getPersonaCreationDate(persona);
                    
                    return (
                      <div key={`milestone-${persona._id}`}>
                        {/* Milestone point */}
                        <div
                          className="absolute top-1/2 transform -translate-y-1/2 z-30"
                          style={{ 
                            left: `${position}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          <div className="w-4 h-4 bg-yellow-400 rounded-full border-2 border-gray-700 shadow-lg relative">
                            {persona.isActive && (
                              <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-30" />
                            )}
                          </div>
                        </div>

                        {/* Date label below road */}
                        <div
                          className="absolute text-sm font-medium text-foreground whitespace-nowrap"
                          style={{
                            left: `${position}%`,
                            transform: 'translateX(-50%)',
                            top: '30px',
                          }}
                        >
                          {formatDate(creationDate)}
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