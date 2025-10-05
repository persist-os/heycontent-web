'use client';

import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import toast from 'react-hot-toast';

export function useWidgetContent(userId: string | null) {
  const addNoteToWidgetMutation = useMutation(api.widgetContentMutations.addNoteToWidget);
  const removeNoteFromWidgetMutation = useMutation(api.widgetContentMutations.removeNoteFromWidget);
  const addConversationToWidgetMutation = useMutation(api.widgetContentMutations.addConversationToWidget);
  const removeConversationFromWidgetMutation = useMutation(api.widgetContentMutations.removeConversationFromWidget);
  const addCrystalToWidgetMutation = useMutation(api.widgetContentMutations.addCrystalToWidget);
  const removeCrystalFromWidgetMutation = useMutation(api.widgetContentMutations.removeCrystalFromWidget);
  const addShardToWidgetMutation = useMutation(api.widgetContentMutations.addShardToWidget);
  const removeShardFromWidgetMutation = useMutation(api.widgetContentMutations.removeShardFromWidget);

  const addNoteToWidget = useCallback(async (
    noteId: Id<"notes">,
    widgetId: string | Id<"widgets">
  ) => {
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      await addNoteToWidgetMutation({ noteId, widgetId, userId });
      toast.success('Note added to widget');
      return true;
    } catch (error) {
      console.error('Failed to add note to widget:', error);
      toast.error('Failed to add note to widget');
      return false;
    }
  }, [userId, addNoteToWidgetMutation]);

  const removeNoteFromWidget = useCallback(async (
    noteId: Id<"notes">
  ) => {
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      await removeNoteFromWidgetMutation({ noteId, userId });
      toast.success('Note removed from widget');
      return true;
    } catch (error) {
      console.error('Failed to remove note from widget:', error);
      toast.error('Failed to remove note from widget');
      return false;
    }
  }, [userId, removeNoteFromWidgetMutation]);

  const addConversationToWidget = useCallback(async (
    conversationId: Id<"conversations">,
    widgetId: string | Id<"widgets">
  ) => {
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      await addConversationToWidgetMutation({ conversationId, widgetId, userId });
      toast.success('Conversation added to widget');
      return true;
    } catch (error) {
      console.error('Failed to add conversation to widget:', error);
      toast.error('Failed to add conversation to widget');
      return false;
    }
  }, [userId, addConversationToWidgetMutation]);

  const removeConversationFromWidget = useCallback(async (
    conversationId: Id<"conversations">
  ) => {
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      await removeConversationFromWidgetMutation({ conversationId, userId });
      toast.success('Conversation removed from widget');
      return true;
    } catch (error) {
      console.error('Failed to remove conversation from widget:', error);
      toast.error('Failed to remove conversation from widget');
      return false;
    }
  }, [userId, removeConversationFromWidgetMutation]);

  const addCrystalToWidget = useCallback(async (
    crystalId: Id<"crystals">,
    widgetId: string | Id<"widgets">
  ) => {
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      await addCrystalToWidgetMutation({ crystalId, widgetId, userId });
      toast.success('Crystal added to widget');
      return true;
    } catch (error) {
      console.error('Failed to add crystal to widget:', error);
      toast.error('Failed to add crystal to widget');
      return false;
    }
  }, [userId, addCrystalToWidgetMutation]);

  const removeCrystalFromWidget = useCallback(async (
    crystalId: Id<"crystals">
  ) => {
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      await removeCrystalFromWidgetMutation({ crystalId, userId });
      toast.success('Crystal removed from widget');
      return true;
    } catch (error) {
      console.error('Failed to remove crystal from widget:', error);
      toast.error('Failed to remove crystal from widget');
      return false;
    }
  }, [userId, removeCrystalFromWidgetMutation]);

  const addShardToWidget = useCallback(async (
    shardId: Id<"crystal_shards">,
    widgetId: string | Id<"widgets">
  ) => {
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      await addShardToWidgetMutation({ shardId, widgetId, userId });
      toast.success('Shard added to widget');
      return true;
    } catch (error) {
      console.error('Failed to add shard to widget:', error);
      toast.error('Failed to add shard to widget');
      return false;
    }
  }, [userId, addShardToWidgetMutation]);

  const removeShardFromWidget = useCallback(async (
    shardId: Id<"crystal_shards">
  ) => {
    if (!userId) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      await removeShardFromWidgetMutation({ shardId, userId });
      toast.success('Shard removed from widget');
      return true;
    } catch (error) {
      console.error('Failed to remove shard from widget:', error);
      toast.error('Failed to remove shard from widget');
      return false;
    }
  }, [userId, removeShardFromWidgetMutation]);

  return {
    addNoteToWidget,
    removeNoteFromWidget,
    addConversationToWidget,
    removeConversationFromWidget,
    addCrystalToWidget,
    removeCrystalFromWidget,
    addShardToWidget,
    removeShardFromWidget,
  };
}
