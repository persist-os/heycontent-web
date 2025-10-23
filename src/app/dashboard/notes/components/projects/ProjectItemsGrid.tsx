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
import { getCurrentUserIdSync } from '@/app/lib/api-helpers';
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
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface ProjectItemsGridProps {
  project: ProjectWithItems;
}

export function ProjectItemsGrid({ project }: ProjectItemsGridProps) {
  const userId = getCurrentUserIdSync();
  const { notes } = useNotes();
  const { removeContentFromProject } = useProjects(userId || undefined);
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteNoteId, setPendingDeleteNoteId] = useState<string | null>(null);
  
  // State for overlay modals - social media overlays removed

  // Initialize content manager
  const contentManager = useContentManager(userId || undefined);

  // Fetch conversations
  const conversations = useQuery(
    api.chatQueries.getHistory,
    userId ? { userId } : "skip"
  );

  // Analysis content removed since insights platform was removed
  const analysisContent: any[] = [];
  const analysisLoading = false;
  

  // Convert project's attached items to unified format using the attachedItems data
  const attachedItems = useMemo(() => {
    const items = project.attachedItems as any;

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
    router.push(`/dashboard/thinking_lab?noteId=${noteId}`);
  };

  const handleChatClick = (chatId: string) => {
    router.push(`/dashboard/thinking_lab?chatId=${chatId}`);
  };

  // Delete handler for notes
  const handleNoteDelete = async (noteId: string) => {
    if (!project) return;
    setPendingDeleteNoteId(noteId);
    setShowDeleteConfirm(true);
  };

  const confirmNoteDelete = async () => {
    if (!project || !pendingDeleteNoteId) return;
    await removeContentFromProject(project._id, 'note', pendingDeleteNoteId);
    setShowDeleteConfirm(false);
    setPendingDeleteNoteId(null);
  };

  // Social media overlay handlers removed

  // Gmail-related functions removed

  const handleAnalysisClick = (item: any) => {
    // For now, just log the click. You can add navigation or modal opening here later
  };

  // Create a single array of all items with their type information
  const allItems = [
    ...(attachedItems.notes || []).map(item => ({ ...item, itemType: 'note' as const })),
    ...(attachedItems.conversations || []).map(item => ({ ...item, itemType: 'conversation' as const })),
  ];




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
              const attachableItem = createAttachableItem(item, 'analysis');
              const analysisData = processAnalysisData(attachableItem);

              const { title, summary, type, timestamp, status } = analysisData;
              
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
      
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPendingDeleteNoteId(null);
        }}
        onConfirm={confirmNoteDelete}
        title="Remove Note"
        titleContext="project.remove_note.title"
        description="Are you sure you want to remove this note from the project?"
        descriptionContext="project.remove_note.description"
        confirmText="Remove"
        confirmContext="button.remove"
        cancelText="Cancel"
        cancelContext="button.cancel"
        variant="destructive"
      />
    </>
  );
} 