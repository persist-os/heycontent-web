'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectWithItems } from '../../types/project';
import { NoteCard } from '../cards/NoteCard';
import { Play, Heart, Eye, Users, MessageCircle, ExternalLink, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber, formatDate, formatDuration } from '@/lib/content-utils';
import { useNotes } from '@/app/context/notes-context';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useContentManager, usePlatformContent } from '@/app/hooks/use-content';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { useProjects } from '../../hooks/useProjects';
import {
  AttachableItem,
  extractRawId,
  convertToAttachableItems,
  groupItemsByType,
  getSectionConfig,
  processAnalysisData,
  getAnalysisTypeColor,
} from '../../utils/project-items';

interface ProjectItemsGridProps {
  project: ProjectWithItems;
}

export function ProjectItemsGrid({ project }: ProjectItemsGridProps) {
  const userId = getCurrentUserId();
  const { notes } = useNotes();
  const { removeItemFromProject } = useProjects(userId);
  const router = useRouter();
  
  // State for overlay modals - social media overlays removed

  // Initialize content manager
  const contentManager = useContentManager(userId);
  
  // Debug content manager
  console.log('Content Manager Debug:', {
    userId,
    contentManager: !!contentManager,
  });

  // Fetch conversations
  const conversations = useQuery(
    api.chatQueries.getHistory,
    userId ? { userId } : "skip"
  );

  // Analysis content removed since insights platform was removed
  const analysisContent: any[] = [];
  const analysisLoading = false;
  
  // Debug content loading
  console.log('Content Loading Debug:', {
    userId,
    analysisContent: analysisContent?.length || 0,
    analysisLoading,
    sampleAnalysis: analysisContent?.[0]?.id,
    // Check if there are analysis items available but not attached
    availableAnalysisCount: analysisContent?.length || 0,
    sampleAnalysisData: analysisContent?.[0],
    // Debug analysis content structure
    analysisContentIds: analysisContent?.map(item => item.id) || [],
    analysisContentTypes: analysisContent?.map(item => item.type) || [],
    // Check if analysis items are being found
    hasAnalysisItems: analysisContent && analysisContent.length > 0,
  });

  // Convert project's attached items to unified format using the attachedItems data
  const attachedItems = useMemo(() => {
    const items = project.attachedItems as any;
      console.log('ProjectItemsGrid Debug - Using attachedItems:', {
    projectId: project._id,
    attachedItems: project.attachedItems,
    notes: project.attachedItems?.notes?.length || 0,
    conversations: project.attachedItems?.conversations?.length || 0,
    analysisItems: project.attachedItems?.analysisItems?.length || 0,
    // Sample analysis items
    sampleAnalysis: project.attachedItems?.analysisItems?.[0],
    // Debug project analysis IDs
    projectAnalysisIds: project.analysisIds || [],
    projectAnalysisIdsLength: project.analysisIds?.length || 0,
  });

    // Convert the attachedItems data to the expected format
    const convertedItems = {
      notes: items?.notes || [],
      conversations: items?.conversations || [],
      analysis: items?.analysisItems || [],
    };

    return convertedItems;
  }, [project]);

  // Navigation handlers for notes and conversations
  const handleNoteClick = (noteId: string) => {
    router.push(`/dashboard/notes?noteId=${noteId}`);
  };

  const handleChatClick = (chatId: string) => {
    router.push(`/dashboard/thinking_lab?chatId=${chatId}`);
  };

  // Delete handler for notes
  const handleNoteDelete = async (noteId: string) => {
    if (!project) return;
    
    const confirmed = window.confirm('Are you sure you want to remove this note from the project?');
    if (confirmed) {
      try {
        // Remove the note from the project
        const success = await removeItemFromProject(project._id, 'note', noteId);
        if (success) {
          console.log('Note removed from project successfully');
        } else {
          console.error('Failed to remove note from project');
        }
      } catch (error) {
        console.error('Error removing note from project:', error);
      }
    }
  };

  // Social media overlay handlers removed

  // Gmail-related functions removed

  const handleAnalysisClick = (item: any) => {
    console.log('Analysis item clicked:', item);
    // For now, just log the click. You can add navigation or modal opening here later
  };

  // Create a single array of all items with their type information
  const allItems = [
    ...(attachedItems.notes || []).map(item => ({ ...item, itemType: 'note' as const })),
    ...(attachedItems.conversations || []).map(item => ({ ...item, itemType: 'conversation' as const })),
  ];

  console.log('All Items Debug:', {
    totalItems: allItems.length,
    itemsByType: allItems.reduce((acc, item) => {
      acc[item.itemType] = (acc[item.itemType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    sampleItems: allItems.slice(0, 3).map(item => ({ 
      id: item._id || item.id, 
      type: item.itemType, 
      title: item.title || item.subject || item.data?.caption || 'Untitled' 
    })),
    // Check available analysis content
    availableAnalysisContent: analysisContent?.length || 0,
    sampleAvailableAnalysis: analysisContent?.[0],
    // Debug analysis content structure
    analysisContentIds: analysisContent?.map(item => item.id) || [],
    analysisContentTypes: analysisContent?.map(item => item.type) || [],
    // Debug attachedItems structure
    attachedItemsKeys: Object.keys(attachedItems),
    attachedItemsAnalysis: attachedItems.analysis,
    attachedItemsAnalysisLength: attachedItems.analysis?.length || 0,
    // Debug raw project data
    rawProjectData: {
      analysisIds: project.analysisIds,
      attachedItemsKeys: Object.keys(project.attachedItems || {}),
      attachedItemsAnalysisItems: project.attachedItems?.analysisItems,
    },
  });



  if (allItems.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">No items found in this project</div>
        </div>
      </div>
    );
  }

  // Helper function to convert actual data to AttachableItem format for processing
  const createAttachableItem = (item: any, type: string): AttachableItem => {
    if (!item) {
      console.warn('createAttachableItem called with null/undefined item');
      return {
        id: '',
        type: type as any,
        title: '',
        preview: '',
        date: 0,
        data: {},
        isAttached: true,
      };
    }
    
    return {
      id: String(item._id || item.id || ''),
      type: type as any,
      title: item.data?.caption || item.snippet?.title || item.subject || item.title || '',
      preview: item.data?.caption || item.snippet?.description || item.snippet || '',
      date: item.data?.timestamp || item.snippet?.published_at || item.createdAt || item._creationTime || 0,
      data: item,
      isAttached: true,
    };
  };

  // Social media card components removed


  return (
    <>
      <div className="p-4">
        {/* Single unified grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 grid-flow-dense auto-rows-min">
          {allItems.map((item: any) => {
            const config = getSectionConfig(item.itemType);
            const Icon = config.icon;
            
            if (item.itemType === 'note') {
              return (
                <div key={item._id} className="h-fit flex flex-col">
                  <div className="flex-1">
                    <NoteCard
                      note={item}
                      availableNotes={[]}
                      onEdit={() => handleNoteClick(String(item._id))}
                      onDelete={() => handleNoteDelete(String(item._id))}
                      onToggleImportant={() => {}}
                      onUpdate={() => {}}
                    />
                  </div>
                </div>
              );
            }

            if (item.itemType === 'conversation') {
              return (
                <div
                  key={item._id}
                  className="bg-background border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer h-fit"
                  onClick={() => handleChatClick(String(item._id))}
                >
                  <div className="p-3">
                    <div className="flex items-start gap-2">
                      <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0", config.bgColor)}>
                        <Icon className={cn("w-3 h-3", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate text-sm">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.messages?.[item.messages.length - 1]?.content?.substring(0, 80) || 'No messages'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.updatedAt || item._creationTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Social media item types removed

            if (item.itemType === 'analysis') {
              console.log('Rendering analysis item:', item);
              const attachableItem = createAttachableItem(item, 'analysis');
              console.log('Created attachable item:', attachableItem);
              const analysisData = processAnalysisData(attachableItem);
              console.log('Processed analysis data:', analysisData);
              
              const { title, summary, type, timestamp, status } = analysisData;
              console.log('Analysis item details:', { title, summary, type, timestamp, status });
              
              return (
                <div
                  key={item._id}
                  className="bg-background border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group h-fit"
                  onClick={() => handleAnalysisClick(item)}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", getSectionConfig('analysis').bgColor)}>
                          {React.createElement(getSectionConfig('analysis').icon, { className: "w-3 h-3" })}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          Analysis Report
                        </span>
                      </div>
                      
                      {/* Status indicator */}
                      <div className="flex items-center gap-1">
                        <div className={cn("w-2 h-2 rounded-full", 
                          status === 'completed' ? 'bg-green-500' : 
                          status === 'processing' ? 'bg-primary' : 'bg-gray-500'
                        )} />
                        <span className="capitalize text-xs">{status}</span>
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-foreground line-clamp-2 mb-1 text-sm">
                      {title}
                    </h3>
                    
                    {/* Type */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      {React.createElement(getSectionConfig('analysis').icon, { className: "w-3 h-3" })}
                      <span className={cn("capitalize font-medium", getAnalysisTypeColor(type))}>
                        {type} Analysis
                      </span>
                    </div>
                    
                    {/* Summary */}
                    {summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {summary}
                      </p>
                    )}
                    
                    {/* Date */}
                    {timestamp && (
                      <p className="text-xs text-muted-foreground">
                        {formatDate(new Date(timestamp).getTime())}
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            // Fallback for unknown types
            return (
              <div
                key={item._id}
                className="bg-background border border-border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-2">
                  <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0", config.bgColor)}>
                    <Icon className={cn("w-3 h-3", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate text-sm">
                      {item.title || 'Untitled'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.date || item.createdAt || item._creationTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Social media overlay modals removed */}
    </>
  );
} 