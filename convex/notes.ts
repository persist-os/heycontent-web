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
  v.literal("brainstorm"),
  v.literal("click")
);

const referenceType = v.union(
  v.literal("ai_insight"),
  v.literal("conversation"),
  v.literal("idea"),
  v.literal("url"),
  v.literal("date"),
  v.literal("brainstorm"),
  v.literal("click")
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

export const updateNote = mutation({
  args: {
    noteId: v.id("notes"),
    userId: v.string(),
    updates: v.object({
      content: v.optional(v.string()),
      platform: v.optional(v.string()),
      templateInput: v.optional(v.any()),
      analysisId: v.optional(v.string()),
      title: v.optional(v.string()),
      important: v.optional(v.boolean()),
      type: v.optional(noteType),
      tags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    // Ownership check
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }
    if (note.userId !== args.userId) {
      throw new Error("Unauthorized: You do not own this note.");
    }
    // Always update updatedAt
    const updatesWithTimestamp = {
      ...args.updates,
      updatedAt: Date.now(),
    };
    await ctx.db.patch(args.noteId, updatesWithTimestamp);
    // Fetch and return the updated note
    const updatedNote = await ctx.db.get(args.noteId);
    return updatedNote;
  },
});

export const deleteNote = mutation({
  args: {
    noteId: v.id("notes"), // Changed from v.string() to v.id("notes")
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // args.noteId is now of type Id<"notes">

    // 1. Get the note by its ID to verify existence and ownership
    const note = await ctx.db.get(args.noteId);

    // 2. Check if note exists
    if (!note) {
      throw new Error("Note not found");
    }

    // 3. Check ownership
    if (note.userId !== args.userId) {
      throw new Error("Unauthorized: You do not own this note.");
    }

    // 4. Delete the note
    await ctx.db.delete(args.noteId);

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
    noteId: v.string(), // Keep as v.string() as it comes from HTTP as a string
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Attempt to get the note by its ID
    const note = await ctx.db.get(args.noteId as Id<"notes">); // Cast string ID to Id<"notes">

    // If note is found, check if the userId matches (for authorization)
    if (note && note.userId === args.userId) {
      return note;
    } else {
      // If note not found, or userId doesn't match, return null
      // This will result in a 404 from the HTTP endpoint if null is returned
      return null; 
    }
  },
});