import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Add a note to a widget by updating the note's widgetId
 */
export const addNoteToWidget = mutation({
  args: {
    noteId: v.id("notes"),
    widgetId: v.union(v.string(), v.id("widgets")),
    userId: v.string(),
  },
  handler: async (ctx, { noteId, widgetId, userId }) => {
    // Verify user owns the note
    const note = await ctx.db.get(noteId);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or unauthorized");
    }

    // Update note with widgetId
    await ctx.db.patch(noteId, {
      widgetId: widgetId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Remove a note from a widget by clearing the widgetId
 */
export const removeNoteFromWidget = mutation({
  args: {
    noteId: v.id("notes"),
    userId: v.string(),
  },
  handler: async (ctx, { noteId, userId }) => {
    // Verify user owns the note
    const note = await ctx.db.get(noteId);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or unauthorized");
    }

    // Clear widgetId
    await ctx.db.patch(noteId, {
      widgetId: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Add a conversation to a widget by updating the conversation's widgetId
 */
export const addConversationToWidget = mutation({
  args: {
    conversationId: v.id("conversations"),
    widgetId: v.union(v.string(), v.id("widgets")),
    userId: v.string(),
  },
  handler: async (ctx, { conversationId, widgetId, userId }) => {
    // Verify user owns the conversation
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    // Update conversation with widgetId
    await ctx.db.patch(conversationId, {
      widgetId: widgetId,
      conversationType: "widget_prompt",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Remove a conversation from a widget by clearing the widgetId
 */
export const removeConversationFromWidget = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, { conversationId, userId }) => {
    // Verify user owns the conversation
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or unauthorized");
    }

    // Clear widgetId
    await ctx.db.patch(conversationId, {
      widgetId: undefined,
      conversationType: "general",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
