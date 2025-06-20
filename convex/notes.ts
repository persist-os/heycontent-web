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
    console.log('🏗️ [Convex createNote] Starting note creation with args:', {
      userId: args.userId,
      title: args.title,
      type: args.type,
      platform: args.platform,
      contentLength: args.content?.length || 0,
      contentPreview: args.content?.substring(0, 50) + "...",
      tags: args.tags,
      important: args.important
    });
    
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

    console.log('💾 [Convex createNote] Final note data being saved:', {
      userId: noteData.userId,
      title: noteData.title,
      type: noteData.type,
      platform: noteData.platform,
      contentLength: noteData.content?.length || 0,
      tags: noteData.tags,
      important: noteData.important,
      createdAt: new Date(noteData.createdAt).toISOString(),
      updatedAt: new Date(noteData.updatedAt).toISOString()
    });

    const noteId = await ctx.db.insert("notes", noteData);
    
    console.log('✅ [Convex createNote] Note created successfully with ID:', noteId);
    console.log('🎯 [Convex createNote] Note saved with type:', noteData.type);
    
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
    typeGenerated: v.optional(v.boolean()),
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
    // Update just the content, title, titleGenerated, typeGenerated, and timestamp
    const patchObj: any = {
      content: args.content,
      title: args.title,
      updatedAt: Date.now(),
    };
    if (args.titleGenerated !== undefined) {
      patchObj.titleGenerated = args.titleGenerated;
    }
    if (args.typeGenerated !== undefined) {
      patchObj.typeGenerated = args.typeGenerated;
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
      typeGenerated: v.optional(v.boolean()),
    })
  },
  handler: async (ctx, args) => {
    console.log('🔄 [Convex updateNote] Starting note update with args:', {
      noteId: args.noteId,
      userId: args.userId,
      updates: {
        ...args.updates,
        content: args.updates.content ? `${args.updates.content.substring(0, 50)}...` : undefined
      }
    });
    
    // 1. Get the note by its ID to verify existence and ownership
    const note = await ctx.db.get(args.noteId);
    console.log('📖 [Convex updateNote] Current note before update:', {
      noteId: args.noteId,
      currentType: note?.type,
      currentTitle: note?.title,
      titleGenerated: note?.titleGenerated,
      typeGenerated: note?.typeGenerated,
      exists: !!note
    });
    
    if (!note) {
      console.error('❌ [Convex updateNote] Note not found for updateNote:', args.noteId);
      throw new Error("Note not found");
    }
    if (note.userId !== args.userId) {
      console.error('🚫 [Convex updateNote] Unauthorized updateNote attempt:', { noteUserId: note.userId, requestUserId: args.userId });
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
    
    console.log('💾 [Convex updateNote] Update object being applied:', {
      ...updateObj,
      content: updateObj.content ? `${updateObj.content.substring(0, 50)}...` : undefined,
      updatedAt: new Date(updateObj.updatedAt).toISOString()
    });
    
    // 3. Patch the note
    await ctx.db.patch(args.noteId, updateObj);
    const updatedNote = await ctx.db.get(args.noteId);
    
    console.log('✅ [Convex updateNote] Note updated successfully:', {
      noteId: args.noteId,
      oldType: note.type,
      newType: updatedNote?.type,
      typeChanged: note.type !== updatedNote?.type,
      titleGenerated: updatedNote?.titleGenerated,
      typeGenerated: updatedNote?.typeGenerated
    });
    
    if (!updatedNote) {
      console.error('⚠️ [Convex updateNote] updateNote returned null after patch:', args.noteId);
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