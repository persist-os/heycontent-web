import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Type definition for note types and reference types
const noteType = v.union(
  v.literal("ai_insight"),
  v.literal("conversation"),
  v.literal("idea"),
  v.literal("url"),
  v.literal("date"),
  v.literal("brainstorm")
);

const referenceType = v.union(
  v.literal("ai_insight"),
  v.literal("conversation"),
  v.literal("idea"),
  v.literal("url"),
  v.literal("date"),
  v.literal("brainstorm")
);

export const getNotesByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const createNote = mutation({
  args: {
    userId: v.string(),
    content: v.string(),
    platform: v.string(),
    templateInput: v.optional(v.any()),
    createdAt: v.number(),
    analysisId: v.optional(v.string()),
    type: v.optional(noteType), // <-- Accept type argument
  },
  handler: async (ctx, args) => {
    // Fill in required fields from schema with defaults if not present
    const noteToInsert = {
      userId: args.userId,
      content: args.content,
      createdAt: args.createdAt,
      updatedAt: args.createdAt,
      title: "Untitled Note",
      important: false,
      tags: [],
      references: [],
      type: args.type, // <-- Set type from argument
    };
    const noteId = await ctx.db.insert("notes", noteToInsert);
    return noteId;
  },
});

export const updateNote = mutation({
  args: {
    noteId: v.id("notes"),
    updates: v.object({
      content: v.optional(v.string()),
      platform: v.optional(v.string()),
      templateInput: v.optional(v.any()),
      analysisId: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.noteId, args.updates);
    // Fetch and return the updated note
    const updatedNote = await ctx.db.get(args.noteId);
    return updatedNote;
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

export const getNote = query({
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

    return note;
  },
});