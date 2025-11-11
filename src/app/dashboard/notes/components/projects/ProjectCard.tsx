'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '../../types/project';
import { Folder, Calendar, Trash2, Share2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: () => void;
  onShare?: (projectId: string) => void;
  dragOverProject?: string | null;
}

export function ProjectCard({ project, onEdit, onDelete, onShare, dragOverProject }: ProjectCardProps) {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ✅ FIX BLOCKER 1: Get user permission for visual distinction
  const userPermission = useQuery(
    api.contentAccessHelpers.getUserContentPermission,
    userId && project._id ? {
      userId,
      contentType: 'project',
      contentId: String(project._id),
    } : 'skip'
  ) as 'owner' | 'edit' | 'read' | null;
  
  // ✅ FIX BLOCKER 1: Determine visual styling based on permission
  const isOwner = userPermission === 'owner';
  const isEditor = userPermission === 'edit';
  const isViewer = userPermission === 'read';
  const canDelete = isOwner; // Only owner can delete
  
  // Border styling: Owner (solid), Editor (dashed), Viewer (dotted)
  const borderStyle = isOwner ? 'border-solid' : isEditor ? 'border-dashed' : isViewer ? 'border-dotted' : 'border-solid';
  
  // Badge styling
  const getBadgeVariant = () => {
    if (isOwner) return 'default';
    if (isEditor) return 'success';
    if (isViewer) return 'outline';
    return 'outline';
  };
  
  const getBadgeText = () => {
    if (isOwner) return 'Owner';
    if (isEditor) return 'Can Edit';
    if (isViewer) return 'Can View';
    return '';
  };

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
    setShowDeleteConfirm(true);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(String(project._id));
  };

  const handleCardClick = () => {
    router.push(`/dashboard/living-projects/${project._id}`);
  };

  const itemCount = 
    (project.noteIds?.length || 0) + 
    (project.conversationIds?.length || 0);

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
        isDraggedOver && "ring-2 ring-primary ring-offset-2 bg-primary/5 border-primary/50 scale-105",
        // ✅ FIX BLOCKER 1: Border style based on permission
        borderStyle,
        isViewer && "opacity-90" // Slightly dimmed for view-only
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
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground truncate">
                  {project.name}
                </h3>
                {/* ✅ FIX BLOCKER 1: Permission badge */}
                {userPermission && (
                  <Badge variant={getBadgeVariant()} className="text-xs flex-shrink-0">
                    {getBadgeText()}
                  </Badge>
                )}
                {/* ✅ FIX BLOCKER 1: Lock icon for view-only */}
                {isViewer && (
                  <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onShare && (isOwner || isEditor) && (
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
              disabled={!canDelete}
              className={cn(
                "h-8 w-8 p-0",
                canDelete 
                  ? "hover:bg-muted hover:text-destructive"
                  : "opacity-50 cursor-not-allowed"
              )}
              title={!canDelete ? "Only project owner can delete" : undefined}
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
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete();
          setShowDeleteConfirm(false);
        }}
        title="Delete Project"
        titleContext="project.delete_confirm.title"
        description={`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
        descriptionContext="project.delete_confirm.description"
        confirmText="Delete"
        confirmContext="button.delete"
        cancelText="Cancel"
        cancelContext="button.cancel"
        variant="destructive"
      />
    </div>
  );
} 