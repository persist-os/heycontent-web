'use client';

import { useCallback, useMemo } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import toast from 'react-hot-toast';
import { AttachmentMode, ContentItem } from '../types/contentAttachment';

interface UseContentAttachmentProps {
  userId: string | null;
  mode: AttachmentMode;
  widgetId?: string | Id<"widgets">;
  projectId?: Id<"projects">;
}

export function useContentAttachment({
  userId,
  mode,
  widgetId,
  projectId
}: UseContentAttachmentProps) {
  // Widget mutations
  const addNoteToWidgetMutation = useMutation(api.widgetContentMutations.addNoteToWidget);
  const removeNoteFromWidgetMutation = useMutation(api.widgetContentMutations.removeNoteFromWidget);
  const addShardToWidgetMutation = useMutation(api.widgetContentMutations.addShardToWidget);
  const removeShardFromWidgetMutation = useMutation(api.widgetContentMutations.removeShardFromWidget);

  // Project mutations - unified via projectsMutations
  const addContentToProjectMutation = useMutation(api.projectsMutations.addContent);
  const removeContentFromProjectMutation = useMutation(api.projectsMutations.removeContent);

  const handleToggleItem = useCallback(async (item: ContentItem) => {
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      const isAttached = item.isAttached;
      
      if (mode === 'widget' && widgetId) {
        // Widget mode - use individual mutations
        if (item.type === 'note') {
          if (isAttached) {
            await removeNoteFromWidgetMutation({ noteId: item.id as Id<"notes">, userId });
            toast.success('Note removed from widget');
          } else {
            await addNoteToWidgetMutation({ noteId: item.id as Id<"notes">, widgetId, userId });
            toast.success('Note added to widget');
          }
        } else if (item.type === 'shard') {
          if (isAttached) {
            await removeShardFromWidgetMutation({ shardId: item.id as Id<"crystal_shards">, userId });
            toast.success('Shard removed from widget');
          } else {
            await addShardToWidgetMutation({ shardId: item.id as Id<"crystal_shards">, widgetId, userId });
            toast.success('Shard added to widget');
          }
        } else {
          // Artifact/stardust - not supported for widgets yet, show message
          toast.error(`${item.type} attachment to widgets not yet supported`);
          return false;
        }
      } else if (mode === 'project' && projectId) {
        // Project mode - use unified addContent/removeContent
        if (isAttached) {
          await removeContentFromProjectMutation({
            projectId,
            userId,
            contentType: item.type,
            contentId: item.id
          });
          toast.success(`${item.type.charAt(0).toUpperCase() + item.type.slice(1)} removed from project`);
        } else {
          await addContentToProjectMutation({
            projectId,
            userId,
            contentType: item.type,
            contentId: item.id
          });
          toast.success(`${item.type.charAt(0).toUpperCase() + item.type.slice(1)} added to project`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to toggle item:', error);
      toast.error('Failed to update content attachment');
      return false;
    }
  }, [
    userId,
    mode,
    widgetId,
    projectId,
    addNoteToWidgetMutation,
    removeNoteFromWidgetMutation,
    addShardToWidgetMutation,
    removeShardFromWidgetMutation,
    addContentToProjectMutation,
    removeContentFromProjectMutation,
  ]);

  return {
    handleToggleItem,
  };
}
