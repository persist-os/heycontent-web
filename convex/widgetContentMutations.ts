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

/**
 * Add a crystal to a widget by updating the crystal's widgetId
 */
export const addCrystalToWidget = mutation({
  args: {
    crystalId: v.id("crystals"),
    widgetId: v.union(v.string(), v.id("widgets")),
    userId: v.string(),
  },
  handler: async (ctx, { crystalId, widgetId, userId }) => {
    // Verify user owns the crystal
    const crystal = await ctx.db.get(crystalId);
    if (!crystal || crystal.userId !== userId) {
      throw new Error("Crystal not found or unauthorized");
    }

    // Update crystal with widgetId
    await ctx.db.patch(crystalId, {
      widgetId: widgetId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Remove a crystal from a widget by clearing the widgetId
 */
export const removeCrystalFromWidget = mutation({
  args: {
    crystalId: v.id("crystals"),
    userId: v.string(),
  },
  handler: async (ctx, { crystalId, userId }) => {
    // Verify user owns the crystal
    const crystal = await ctx.db.get(crystalId);
    if (!crystal || crystal.userId !== userId) {
      throw new Error("Crystal not found or unauthorized");
    }

    // Clear widgetId
    await ctx.db.patch(crystalId, {
      widgetId: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Add a shard to a widget by updating the shard's widgetId
 */
export const addShardToWidget = mutation({
  args: {
    shardId: v.id("crystal_shards"),
    widgetId: v.union(v.string(), v.id("widgets")),
    userId: v.string(),
  },
  handler: async (ctx, { shardId, widgetId, userId }) => {
    // Verify user owns the shard
    const shard = await ctx.db.get(shardId);
    if (!shard || shard.userId !== userId) {
      throw new Error("Shard not found or unauthorized");
    }

    // Update shard with widgetId
    await ctx.db.patch(shardId, {
      widgetId: widgetId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Remove a shard from a widget by clearing the widgetId
 */
export const removeShardFromWidget = mutation({
  args: {
    shardId: v.id("crystal_shards"),
    userId: v.string(),
  },
  handler: async (ctx, { shardId, userId }) => {
    // Verify user owns the shard
    const shard = await ctx.db.get(shardId);
    if (!shard || shard.userId !== userId) {
      throw new Error("Shard not found or unauthorized");
    }

    // Clear widgetId
    await ctx.db.patch(shardId, {
      widgetId: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
