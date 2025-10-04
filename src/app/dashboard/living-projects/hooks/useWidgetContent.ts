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

  return {
    addNoteToWidget,
    removeNoteFromWidget,
    addConversationToWidget,
    removeConversationFromWidget,
  };
}
