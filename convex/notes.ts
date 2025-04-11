import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Type definition for note types
const noteType = v.union(
  v.literal("ai_insight"),
  v.literal("conversation"),
  v.literal("idea"),
  v.literal("url"),
  v.literal("date")
);

export const getNotes = query({
  args: { 
    userId: v.string(),
    type: v.optional(noteType),
    important: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("notes")
      .filter((q) => q.eq(q.field("userId"), args.userId));

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    if (args.important !== undefined) {
      query = query.filter((q) => q.eq(q.field("important"), args.important));
    }

    const notes = await query.order("desc").collect();
    return notes;
  },
});

export const createNote = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    important: v.boolean(),
    type: v.optional(noteType),
    tags: v.optional(v.array(v.string())),
    references: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const noteId = await ctx.db.insert("notes", {
      ...args,
      type: args.type || "idea",
      tags: args.tags || [],
      references: args.references || [],
      createdAt: now,
      updatedAt: now,
    });

    return noteId;
  },
});

export const updateNote = mutation({
  args: {
    noteId: v.string(),
    userId: v.string(),
    updates: v.object({
      title: v.optional(v.string()),
      content: v.optional(v.string()),
      important: v.optional(v.boolean()),
      type: v.optional(noteType),
      tags: v.optional(v.array(v.string())),
      references: v.optional(v.array(v.string())),
      updatedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db
      .query("notes")
      .filter((q) => 
        q.eq(q.field("_id"), args.noteId) &&
        q.eq(q.field("userId"), args.userId)
      )
      .first();

    if (!note) {
      throw new Error("Note not found or unauthorized");
    }

    await ctx.db.patch(note._id, args.updates);
    return { ...note, ...args.updates };
  },
});

export const deleteNote = mutation({
  args: {
    noteId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db
      .query("notes")
      .filter((q) => 
        q.eq(q.field("_id"), args.noteId) &&
        q.eq(q.field("userId"), args.userId)
      )
      .first();

    if (!note) {
      throw new Error("Note not found or unauthorized");
    }

    await ctx.db.delete(note._id);
    return { success: true };
  },
});

// Type-specific queries
export const getIdeas = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) => 
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("type"), "idea")
      )
      .order("desc")
      .collect();
  },
});

export const getAIInsights = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) => 
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("type"), "ai_insight")
      )
      .order("desc")
      .collect();
  },
});

export const getConversations = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) => 
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("type"), "conversation")
      )
      .order("desc")
      .collect();
  },
}); 