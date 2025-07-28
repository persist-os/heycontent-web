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
import { ArrowLeft, Edit, Trash2, Plus } from 'lucide-react';
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
    
    // Add Instagram posts
    if (project.instagramPostIds) {
      items.push(...project.instagramPostIds.map(id => `instagram:${id}`));
    }
    
    // Add YouTube videos
    if (project.youtubeVideoIds) {
      items.push(...project.youtubeVideoIds.map(id => `youtube:${id}`));
    }
    
    // Add Gmail items
    if (project.gmailIds) {
      items.push(...project.gmailIds.map(id => `gmail:${id}`));
    }
    
    // Add analysis items
    if (project.analysisIds) {
      items.push(...project.analysisIds.map(id => `insights:${id}`));
    }
    
    return new Set(items);
  }, [project]);

  // Handle attachment toggle
  const handleToggleAttachment = async (contentId: string, isAttached: boolean) => {
    if (!project) return;

    try {
      // Parse the standardized content ID
      const [platform, ...rest] = contentId.split(':');
      
      // For analysis items, we need the full ID after "insights:"
      // For other items, we need the full ID after the platform (including any additional parts)
      const actualId = platform === 'insights' ? rest.join(':') : rest.join(':');
      
      // Map platform to item type
      const itemTypeMap: Record<string, any> = {
        'notes': 'note',
        'conversations': 'conversation',
        'instagram': 'instagramPost',
        'youtube': 'youtubeVideo',
        'gmail': 'gmail',
        'insights': 'analysis'
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
        {/* Header Skeleton */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="w-16 h-8 bg-muted rounded animate-pulse"></div>
            <div>
              <div className="w-48 h-8 bg-muted rounded animate-pulse mb-2"></div>
              <div className="w-72 h-4 bg-muted rounded animate-pulse mb-2"></div>
              <div className="w-32 h-3 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-8 bg-muted rounded animate-pulse"></div>
            <div className="w-16 h-8 bg-muted rounded animate-pulse"></div>
            <div className="w-20 h-8 bg-muted rounded animate-pulse"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-background border border-border rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-muted rounded-lg animate-pulse"></div>
                  <div className="flex-1">
                    <div className="w-32 h-4 bg-muted rounded animate-pulse mb-2"></div>
                    <div className="w-24 h-3 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-3 bg-muted rounded animate-pulse"></div>
                  <div className="w-3/4 h-3 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-lg font-semibold text-foreground mb-2">Project not found</h2>
        <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const itemCount = 
    (project.attachedItems?.notes?.length || 0) + 
    (project.attachedItems?.conversations?.length || 0) + 
    (project.attachedItems?.instagramPosts?.length || 0) + 
    (project.attachedItems?.youtubeVideos?.length || 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {itemCount} item{itemCount !== 1 ? 's' : ''} • Created {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAttachmentPanel(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Items
          </Button>
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDelete}
            className="hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {itemCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No items yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Start organizing your content by adding notes, conversations, and other items to this project.
            </p>
            <Button onClick={() => setShowAttachmentPanel(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Item
            </Button>
          </div>
        ) : (
          <ProjectItemsGrid project={project} />
        )}
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

      {/* Floating Create Note Button */}
      <button
        onClick={handleCreateNote}
        disabled={isCreatingNote}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors flex items-center justify-center shadow-lg hover:shadow-xl z-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        title={isCreatingNote ? "Creating note..." : "Create new note in project"}
      >
        {isCreatingNote ? (
          <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>
    </div>
  );
} 