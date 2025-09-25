'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectWithItems } from '../../types/project';
import { useProjectDetails } from '../../hooks/useProjectDetails';
import { useProjects } from '../../hooks/useProjects';
import { useCreateNote } from '../../hooks/useCreateNote';
import { useNotes } from '@/app/context/notes-context';
import { Id } from '@/convex/_generated/dataModel';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Plus, Folder } from 'lucide-react';
import { UnifiedContentSelector } from '@/components/ui/UnifiedContentSelector';
import { ProjectItemsGrid } from './ProjectItemsGrid';
import { EditProjectModal } from './EditProjectModal';
import toast from 'react-hot-toast';

interface ProjectDetailPageProps {
  projectId: Id<"projects">;
}

export function ProjectDetailPage({ projectId }: ProjectDetailPageProps) {
  const router = useRouter();
  const userId = getCurrentUserId();
  const { project, isLoading } = useProjectDetails(projectId, userId);
  const { updateProject, deleteProject, addItemToProject, removeItemFromProject, migrateAnalysisItems } = useProjects(userId);
  const { createNote } = useCreateNote();
  const { setActiveNoteId } = useNotes();
  
  const [showAttachmentPanel, setShowAttachmentPanel] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  // Create attached items set for the unified selector
  const attachedItems = React.useMemo(() => {
    if (!project) return new Set<string>();
    
    const items: string[] = [];
    
    // Add notes
    if (project.noteIds) {
      items.push(...project.noteIds.map(id => `notes:${id}`));
    }
    
    // Add conversations  
    if (project.conversationIds) {
      items.push(...project.conversationIds.map(id => `conversations:${id}`));
    }
    
    
    
    return new Set(items);
  }, [project]);

  // Handle attachment toggle
  const handleToggleAttachment = async (contentId: string, isAttached: boolean) => {
    if (!project) return;

    try {
      // Parse the standardized content ID
      const [platform, ...rest] = contentId.split(':');
      
      // Get the full ID after the platform prefix
      const actualId = rest.join(':');
      
      // Map platform to item type
      const itemTypeMap: Record<string, any> = {
        'notes': 'note',
        'conversations': 'conversation'
      };

      const itemType = itemTypeMap[platform];
      if (!itemType) {
        console.error('Unknown platform for content ID:', contentId);
        return;
      }
      
      console.log('Toggle attachment debug:', {
        contentId,
        platform,
        actualId,
        itemType,
        isAttached,
        // Additional debugging for analysis items
        isAnalysisItem: platform === 'insights',
        fullContentId: contentId,
        parsedPlatform: platform,
        parsedActualId: actualId
      });

      if (isAttached) {
        const success = await removeItemFromProject(projectId, itemType, actualId);
        if (success) {
          toast.success('Item removed from project');
        }
      } else {
        const success = await addItemToProject(projectId, itemType, actualId);
        if (success) {
          toast.success('Item added to project');
        }
      }
    } catch (error) {
      console.error('Error toggling attachment:', error);
      toast.error('Failed to update project');
    }
  };

  const handleBack = () => {
    router.push('/dashboard/notes');
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    if (!project) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      const success = await deleteProject(projectId);
      if (success) {
        router.push('/dashboard/notes');
      }
    }
  };

  const handleUpdateProject = async (name: string, description?: string) => {
    const success = await updateProject(projectId, { name, description });
    if (success) {
      setShowEditModal(false);
    }
    return success;
  };

  const handleCreateNote = async () => {
    setIsCreatingNote(true);
    try {
      // Create a new note
      const newNoteId = await createNote('', {
        customTitle: 'New Note',
        redirect: false
      });
      
      if (newNoteId) {
        // Add the note to the current project
        const success = await addItemToProject(projectId, 'note', newNoteId);
        
        if (success) {
          // Set the note as active and navigate to notes page with project context
          setActiveNoteId(newNoteId);
          toast.success('Note created and added to project');
          
          // Navigate to the notes page with project context for proper back navigation
          router.push(`/dashboard/notes?noteId=${newNoteId}&fromProject=true&projectId=${projectId}`);
        }
      }
    } catch (error) {
      console.error('Failed to create note for project:', error);
      toast.error('Failed to create note');
    } finally {
      setIsCreatingNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        {/* Elegant loading header */}
        <div className="px-6 pt-8 pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
              <div className="lg:col-span-2">
                <div className="flex items-baseline gap-6 mb-2">
                  <div className="w-24 h-4 bg-muted/30 rounded animate-pulse"></div>
                  <div className="h-px bg-gradient-to-r from-border/20 to-transparent flex-1 mb-3" />
                </div>
                <div className="w-80 h-12 bg-muted/30 rounded animate-pulse mb-3"></div>
                <div className="w-96 h-5 bg-muted/20 rounded animate-pulse ml-2"></div>
                <div className="flex items-center gap-6 mt-4 ml-2">
                  <div className="w-16 h-4 bg-muted/20 rounded animate-pulse"></div>
                  <div className="w-px h-4 bg-border/20"></div>
                  <div className="w-24 h-4 bg-muted/20 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex flex-col items-start lg:items-end gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-20 h-4 bg-muted/20 rounded animate-pulse"></div>
                  <div className="w-24 h-4 bg-muted/20 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-muted/20 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Elegant content skeleton */}
        <div className="flex-1 overflow-auto px-6">
          <div className="max-w-7xl mx-auto pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-background/50 border border-border/30 rounded-2xl p-6 hover:bg-background/80 transition-colors">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-muted/30 rounded-xl animate-pulse"></div>
                    <div className="flex-1">
                      <div className="w-32 h-4 bg-muted/30 rounded animate-pulse mb-2"></div>
                      <div className="w-24 h-3 bg-muted/20 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="w-full h-3 bg-muted/20 rounded animate-pulse"></div>
                    <div className="w-3/4 h-3 bg-muted/20 rounded animate-pulse"></div>
                    <div className="w-1/2 h-3 bg-muted/20 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-gradient-to-br from-muted/20 to-muted/5 flex items-center justify-center">
            <Folder className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h2 className="text-2xl font-light tracking-tight text-foreground mb-4">
            Project not found
          </h2>
          <p className="text-muted-foreground/70 font-light leading-relaxed mb-8">
            This project may have been moved, deleted, or you might not have the necessary permissions to access it.
          </p>
          <button
            onClick={handleBack}
            className="text-foreground hover:text-muted-foreground transition-colors text-sm font-light tracking-wide border-b border-border/30 hover:border-foreground pb-1"
          >
            ← Return to Notes
          </button>
        </div>
      </div>
    );
  }

  const itemCount = 
    (project.attachedItems?.notes?.length || 0) + 
    (project.attachedItems?.conversations?.length || 0);

  return (
    <div className="flex flex-col h-full">
      {/* Anti-corporate header with asymmetric layout */}
      <div className="px-6 pt-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
            <div className="lg:col-span-2">
              <div className="flex items-baseline gap-6 mb-2">
                <button
                  onClick={handleBack}
                  className="text-muted-foreground/60 hover:text-foreground transition-colors text-sm font-light tracking-wide"
                >
                  ← Back to Notes
                </button>
                <div className="h-px bg-gradient-to-r from-border/50 to-transparent flex-1 mb-3" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-light tracking-tight text-foreground mb-3">
                {project.name}
              </h1>
              {project.description && (
                <h2 className="text-lg font-light text-muted-foreground ml-2 tracking-wide leading-relaxed">
                  {project.description}
                </h2>
              )}
              <div className="flex items-center gap-6 mt-4 ml-2 text-sm text-muted-foreground/70">
                <span className="font-light">
                  {itemCount} item{itemCount !== 1 ? 's' : ''}
                </span>
                <span className="w-px h-4 bg-border/30" />
                <span className="font-light">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-start lg:items-end gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAttachmentPanel(true)}
                  className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors tracking-wide"
                >
                  Add Items
                </button>
                <button
                  onClick={handleEdit}
                  className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors tracking-wide"
                >
                  Edit Project
                </button>
                <button
                  onClick={handleDelete}
                  className="text-sm font-light text-destructive/70 hover:text-destructive transition-colors tracking-wide"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content with elegant spacing */}
      <div className="flex-1 overflow-auto px-6">
        <div className="max-w-7xl mx-auto">
          {itemCount === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] py-16">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
                  <Plus className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-2xl font-light tracking-tight text-foreground mb-4">
                  Empty canvas awaits
                </h3>
                <p className="text-muted-foreground/70 font-light leading-relaxed mb-8">
                  Transform this space by weaving together your notes, conversations, and creative content into a unified narrative.
                </p>
                <button
                  onClick={() => setShowAttachmentPanel(true)}
                  className="text-foreground hover:text-muted-foreground transition-colors text-sm font-light tracking-wide border-b border-border/30 hover:border-foreground pb-1"
                >
                  Begin composing →
                </button>
              </div>
            </div>
          ) : (
            <div className="pb-8">
              <ProjectItemsGrid project={project} />
            </div>
          )}
        </div>
      </div>

      {/* Attachment Panel */}
      {showAttachmentPanel && (
        <UnifiedContentSelector
          mode="attach"
          isOpen={showAttachmentPanel}
          onClose={() => setShowAttachmentPanel(false)}
          attachedItems={attachedItems}
          onToggleAttachment={handleToggleAttachment}
          showAttachedSection={true}
          userId={userId}
        />
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <EditProjectModal
          project={project}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdateProject={handleUpdateProject}
          isUpdating={isUpdating}
        />
      )}

      {/* Elegant floating create button */}
      <button
        onClick={handleCreateNote}
        disabled={isCreatingNote}
        className="fixed bottom-8 right-8 group z-50 disabled:opacity-50 disabled:cursor-not-allowed"
        title={isCreatingNote ? "Creating note..." : "Create new note in project"}
      >
        <div className="relative">
          {/* Subtle backdrop blur effect */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl border border-border/40 shadow-lg group-hover:shadow-xl group-hover:border-border/60 transition-all duration-300" />
          
          {/* Button content */}
          <div className="relative px-4 py-3 flex items-center gap-2">
            {isCreatingNote ? (
              <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4 text-foreground/70 group-hover:text-foreground transition-colors" />
            )}
            <span className="text-sm font-light text-foreground/70 group-hover:text-foreground transition-colors tracking-wide">
              New Note
            </span>
          </div>
        </div>
      </button>
    </div>
  );
} 