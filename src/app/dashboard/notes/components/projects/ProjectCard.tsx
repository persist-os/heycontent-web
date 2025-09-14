'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '../../types/project';
import { Folder, Calendar, Trash2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: () => void;
  onShare?: (projectId: string) => void;
  dragOverProject?: string | null;
}

export function ProjectCard({ project, onEdit, onDelete, onShare, dragOverProject }: ProjectCardProps) {
  const router = useRouter();

  // Set up droppable functionality
  const { isOver, setNodeRef } = useDroppable({
    id: String(project._id),
    data: {
      type: 'project',
      project,
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      onDelete();
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(String(project._id));
  };

  const handleCardClick = () => {
    router.push(`/dashboard/notes/projects/${project._id}`);
  };

  const itemCount = 
    (project.noteIds?.length || 0) + 
    (project.conversationIds?.length || 0) + 
    (project.instagramPostIds?.length || 0) + 
    (project.youtubeVideoIds?.length || 0);

  // Determine if this project is being dragged over
  const isDraggedOver = isOver || dragOverProject === String(project._id);

  return (
    <div
      ref={setNodeRef}
      onClick={handleCardClick}
      className={cn(
        "group relative border border-border rounded-lg shadow-sm transition-all duration-200",
        "hover:shadow-md hover:border-border/60 cursor-pointer",
        "hover:shadow-lg hover:bg-blue-100 dark:hover:bg-blue-900/20",
        // Add visual feedback for drag over
        isDraggedOver && "ring-2 ring-primary ring-offset-2 bg-primary/5 border-primary/50 scale-105"
      )}
    >
      {/* Drop zone indicator */}
      {isDraggedOver && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium">
            Drop note here to add to project
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
              isDraggedOver 
                ? "bg-primary/20 text-primary" 
                : "text-blue-600 dark:text-blue-400"
            )}>
              <Folder className="w-4 h-4" />
            </div>
            <h3 className="font-medium text-foreground truncate flex-1">
              {project.name}
            </h3>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onShare && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-8 w-8 p-0 hover:bg-muted hover:text-blue-500"
              >
                <Share2 className="w-3 h-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 w-8 p-0 hover:bg-muted hover:text-destructive"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(project.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Item breakdown if has items */}
        {itemCount > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex flex-wrap gap-2 text-xs">
              {project.noteIds && project.noteIds.length > 0 && (
                <span className={cn(
                  "px-2 py-1 rounded transition-colors",
                  isDraggedOver 
                    ? "bg-primary/20 text-primary" 
                    : "bg-primary/20 dark:bg-primary/20 text-primary dark:text-primary"
                )}>
                  {project.noteIds.length} note{project.noteIds.length !== 1 ? 's' : ''}
                </span>
              )}
              {project.conversationIds && project.conversationIds.length > 0 && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                  {project.conversationIds.length} chat{project.conversationIds.length !== 1 ? 's' : ''}
                </span>
              )}
              {project.instagramPostIds && project.instagramPostIds.length > 0 && (
                <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 rounded">
                  {project.instagramPostIds.length} IG post{project.instagramPostIds.length !== 1 ? 's' : ''}
                </span>
              )}
              {project.youtubeVideoIds && project.youtubeVideoIds.length > 0 && (
                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded">
                  {project.youtubeVideoIds.length} video{project.youtubeVideoIds.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 