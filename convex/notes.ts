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

// CREATE NOTE MUTATION
export const createNote = mutation({
  args: {
    userId: v.string(),
    content: v.optional(v.string()),
    platform: v.optional(v.string()),
    type: v.optional(noteType),
    templateInput: v.optional(v.any()),
    analysisId: v.optional(v.string()),
    title: v.optional(v.string()),
    important: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    references: v.optional(v.array(v.any())), // Use v.any() for flexibility with references
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // Required fields with defaults
    const noteData: any = {
      userId: args.userId,
      title: args.title ?? "",
      content: args.content ?? "",
      platform: args.platform ?? "",
      type: args.type ?? "idea",
      important: args.important ?? false,
      tags: args.tags ?? [],
      references: args.references ?? [],
      createdAt: now,
      updatedAt: now,
    };
    if (args.templateInput) noteData.templateInput = args.templateInput;
    if (args.analysisId) noteData.analysisId = args.analysisId;
    const noteId = await ctx.db.insert("notes", noteData);
    const createdNote = await ctx.db.get(noteId);
    return createdNote;
  },
});

export const getNotesByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Simple mutation just for updating note content and title
export const updateNoteContent = mutation({
  args: {
    noteId: v.id("notes"),
    userId: v.string(),
    content: v.string(),
    title: v.string(),
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
    
    // Update just the content, title and timestamp
    await ctx.db.patch(args.noteId, {
      content: args.content,
      title: args.title,
      updatedAt: Date.now(),
    });
    
    // Return the updated note
    return await ctx.db.get(args.noteId);
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
      // Handle references separately to avoid schema validation issues
      references: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    try {
      // Ownership check
      const note = await ctx.db.get(args.noteId);
      if (!note) {
        throw new Error("Note not found");
      }
      if (note.userId !== args.userId) {
        throw new Error("Unauthorized: You do not own this note.");
      }

      // Create a clean update object with only valid fields
      const cleanUpdates: any = {};
      
      // Handle basic fields
      if (args.updates.content !== undefined) cleanUpdates.content = args.updates.content;
      if (args.updates.title !== undefined) cleanUpdates.title = args.updates.title;
      if (args.updates.platform !== undefined) cleanUpdates.platform = args.updates.platform;
      if (args.updates.important !== undefined) cleanUpdates.important = args.updates.important;
      if (args.updates.type !== undefined) cleanUpdates.type = args.updates.type;
      if (args.updates.templateInput !== undefined) cleanUpdates.templateInput = args.updates.templateInput;
      if (args.updates.analysisId !== undefined) cleanUpdates.analysisId = args.updates.analysisId;
      
      // Handle array fields
      if (Array.isArray(args.updates.tags)) cleanUpdates.tags = args.updates.tags;
      
      // Handle references field specially
      if (args.updates.references !== undefined) {
        // Ensure references is an array or set to empty array
        cleanUpdates.references = Array.isArray(args.updates.references) 
          ? args.updates.references 
          : [];
      }
      
      // Always update updatedAt
      cleanUpdates.updatedAt = Date.now();
      
      // Apply the update
      await ctx.db.patch(args.noteId, cleanUpdates);
      
      // Fetch and return the updated note
      const updatedNote = await ctx.db.get(args.noteId);
      return updatedNote;
    } catch (error) {
      // Log the error for debugging
      console.error("Error in updateNote:", error);
      throw error;
    }
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