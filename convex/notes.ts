import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { error } from "console";

// Type definition for note types and reference types
const noteType = v.union(
  v.literal("idea_bank"),
  v.literal("content_script"),
  v.literal("collaboration_note"),
  v.literal("analytics_insight"),
  v.literal("reflection_journal"),
  v.literal("task_checklist")
);

const referenceType = v.union(
  v.literal("idea_bank"),
  v.literal("content_script"),
  v.literal("collaboration_note"),
  v.literal("analytics_insight"),
  v.literal("reflection_journal"),
  v.literal("task_checklist")
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

  },
  handler: async (ctx, args) => {
    console.log('createNote args:', args); // Debug log
    const now = Date.now();
    // Required fields with defaults
    const noteData: any = {
      userId: args.userId,
      title: typeof args.title === "string" ? args.title : "",
      content: args.content ?? "",
      platform: args.platform ?? "",
      type: args.type ?? "idea_bank",
      important: args.important ?? false,
      tags: Array.isArray(args.tags) ? args.tags : [],
      createdAt: now,
      updatedAt: now,
    };

    const noteId = await ctx.db.insert("notes", noteData);
    return noteId;
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
    titleGenerated: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    console.log('[Convex] updateNoteContent called with:', args);
    // Ownership check
    const note = await ctx.db.get(args.noteId);
    console.log('[Convex] Note before updateNoteContent:', note);
    if (!note) {
      console.error('[Convex] Note not found for updateNoteContent:', args.noteId);
      throw new Error("Note not found");
    }
    if (note.userId !== args.userId) {
      console.error('[Convex] Unauthorized updateNoteContent attempt:', { noteUserId: note.userId, requestUserId: args.userId });
      throw new Error("Unauthorized: You do not own this note.");
    }
    // Update just the content, title, titleGenerated, and timestamp
    const patchObj: any = {
      content: args.content,
      title: args.title,
      updatedAt: Date.now(),
    };
    if (args.titleGenerated !== undefined) {
      patchObj.titleGenerated = args.titleGenerated;
    }
    await ctx.db.patch(args.noteId, patchObj);
    const updatedNote = await ctx.db.get(args.noteId);
    console.log('[Convex] Note after updateNoteContent:', updatedNote);
    if (!updatedNote) {
      console.error('[Convex] updateNoteContent returned null after patch:', args.noteId);
    }
    // Return the updated note
    return updatedNote;
  },
});

// UPDATE NOTE MUTATION

export const updateNote = mutation({
  args: {
    noteId: v.id("notes"),
    userId: v.string(),
    updates: v.object({
      content: v.optional(v.string()),
      title: v.optional(v.string()),
      analysis: v.optional(v.string()),
      important: v.optional(v.boolean()),
      type: v.optional(noteType),
      tags: v.optional(v.array(v.string())),
      platform: v.optional(v.string()),
      postType: v.optional(v.string()),
      goal: v.optional(v.string()),
      fields: v.optional(v.any()),
      titleGenerated: v.optional(v.boolean()),
    })
  },
  handler: async (ctx, args) => {
    console.log('[Convex] updateNote called with:', args);
    // 1. Get the note by its ID to verify existence and ownership
    const note = await ctx.db.get(args.noteId);
    console.log('[Convex] Note before updateNote:', note);
    if (!note) {
      console.error('[Convex] Note not found for updateNote:', args.noteId);
      throw new Error("Note not found");
    }
    if (note.userId !== args.userId) {
      console.error('[Convex] Unauthorized updateNote attempt:', { noteUserId: note.userId, requestUserId: args.userId });
      throw new Error("Unauthorized: You do not own this note.");
    }
    // 2. Build update object
    const updateObj: any = { updatedAt: Date.now() };
    for (const key of Object.keys(args.updates)) {
      const value = args.updates[key];
      if (value !== undefined) {
        updateObj[key] = value;
      }
    }
    // 3. Patch the note
    await ctx.db.patch(args.noteId, updateObj);
    const updatedNote = await ctx.db.get(args.noteId);
    console.log('[Convex] Note after updateNote:', updatedNote);
    if (!updatedNote) {
      console.error('[Convex] updateNote returned null after patch:', args.noteId);
    }
    // 4. Return updated note
    return updatedNote;
  },
});

// DELETE NOTE MUTATION
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

// Add analysis to an existing note
export const addAnalysisToNote = mutation({
  args: {
    noteId: v.id("notes"),
    analysis: v.string(),
  },
  handler: async (ctx, args) => {
    const { noteId, analysis } = args;
    await ctx.db.patch(noteId, {
      analysis,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(noteId);
  },
});

export const getAnalysisforNote = query({
  args: {
    noteId: v.id("notes"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { noteId, userId } = args;
    const note = await ctx.db.get(noteId);
    if (!note) {
      throw new Error("Note not found");
    }
    if (note.userId !== userId) {
      throw new Error("Unauthorized: You do not own this note.");
    }
    return note.analysis;
  },
});

// Type-specific queries
export const getIdeaBank = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) =>
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("type"), "idea_bank")
      )
      .order("desc")
      .collect();
  },
});

export const getContentScripts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) =>
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("type"), "content_script")
      )
      .order("desc")
      .collect();
  },
});

export const getCollaborationNotes = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) =>
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("type"), "collaboration_note")
      )
      .order("desc")
      .collect();
  },
});

export const getAnalyticsInsights = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) =>
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("type"), "analytics_insight")
      )
      .order("desc")
      .collect();
  },
});

export const getReflectionJournal = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) =>
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("type"), "reflection_journal")
      )
      .order("desc")
      .collect();
  },
});

export const getTaskChecklists = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) =>
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("type"), "task_checklist")
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