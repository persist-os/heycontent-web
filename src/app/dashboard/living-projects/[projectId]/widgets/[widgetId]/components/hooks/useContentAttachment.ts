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
  const addConversationToWidgetMutation = useMutation(api.widgetContentMutations.addConversationToWidget);
  const removeConversationFromWidgetMutation = useMutation(api.widgetContentMutations.removeConversationFromWidget);
  const addCrystalToWidgetMutation = useMutation(api.widgetContentMutations.addCrystalToWidget);
  const removeCrystalFromWidgetMutation = useMutation(api.widgetContentMutations.removeCrystalFromWidget);
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
        } else if (item.type === 'conversation') {
          if (isAttached) {
            await removeConversationFromWidgetMutation({ conversationId: item.id as Id<"conversations">, userId });
            toast.success('Conversation removed from widget');
          } else {
            await addConversationToWidgetMutation({ conversationId: item.id as Id<"conversations">, widgetId, userId });
            toast.success('Conversation added to widget');
          }
        } else if (item.type === 'crystal') {
          if (isAttached) {
            await removeCrystalFromWidgetMutation({ crystalId: item.id as Id<"crystals">, userId });
            toast.success('Crystal removed from widget');
          } else {
            await addCrystalToWidgetMutation({ crystalId: item.id as Id<"crystals">, widgetId, userId });
            toast.success('Crystal added to widget');
          }
        } else if (item.type === 'shard') {
          if (isAttached) {
            await removeShardFromWidgetMutation({ shardId: item.id as Id<"crystal_shards">, userId });
            toast.success('Shard removed from widget');
          } else {
            await addShardToWidgetMutation({ shardId: item.id as Id<"crystal_shards">, widgetId, userId });
            toast.success('Shard added to widget');
          }
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
    addConversationToWidgetMutation,
    removeConversationFromWidgetMutation,
    addCrystalToWidgetMutation,
    removeCrystalFromWidgetMutation,
    addShardToWidgetMutation,
    removeShardFromWidgetMutation,
    addContentToProjectMutation,
    removeContentFromProjectMutation,
  ]);

  return {
    handleToggleItem,
  };
}
