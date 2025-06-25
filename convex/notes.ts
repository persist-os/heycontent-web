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

export const getNotesByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// UPDATE NOTE MUTATION

export const updateNote = mutation({
  args: {
    noteId: v.optional(v.id("notes")),
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
      images: v.optional(v.array(v.object({
        url: v.string(),
        filename: v.string(),
        originalFilename: v.optional(v.string()),
        uploadedAt: v.number(),
        size: v.optional(v.number()),
        mimeType: v.optional(v.string()),
        width: v.optional(v.number()),
        height: v.optional(v.number())
      }))),
    })
  },
  handler: async (ctx, args) => {
    const { noteId, userId, updates } = args;

    // DEBUG: Log all incoming parameters
    console.log('🔍 [Convex updateNote] Received args:', {
      noteId,
      noteIdType: typeof noteId,
      userId,
      userIdType: typeof userId,
      updatesKeys: Object.keys(updates),
      hasImages: 'images' in updates,
      imagesCount: updates.images?.length || 0
    });

    // DEBUG: If images are being updated, log their structure
    if (updates.images) {
      console.log('🖼️ [Convex updateNote] Images update detected:');
      console.log('Images array:', updates.images);
      updates.images.forEach((img, index) => {
        console.log(`Image ${index}:`, {
          url: img.url,
          urlType: typeof img.url,
          filename: img.filename,
          filenameType: typeof img.filename,
          originalFilename: img.originalFilename,
          uploadedAt: img.uploadedAt,
          uploadedAtType: typeof img.uploadedAt,
          size: img.size,
          mimeType: img.mimeType,
          width: img.width,
          height: img.height
        });
      });
    }

    // CREATE new note if no ID is provided
    if (!noteId) {
      console.log('✨ [Convex updateNote] No note ID, creating a new note...');
      const now = Date.now();
      const newNoteData = {
        userId,
        title: updates.title ?? "",
        content: updates.content ?? "",
        platform: updates.platform ?? "",
        type: updates.type ?? "idea_bank",
        important: updates.important ?? false,
        tags: updates.tags ?? [],
        ...updates,
        titleGenerated: updates.titleGenerated ?? false,
        typeGenerated: updates.typeGenerated ?? false,
        createdAt: now,
        updatedAt: now,
      };
      const newNoteId = await ctx.db.insert("notes", newNoteData);
      console.log('✅ [Convex updateNote] New note created successfully:', newNoteId);
      return await ctx.db.get(newNoteId);
    }

    // UPDATE existing note if ID is provided
    console.log('🔄 [Convex updateNote] Starting note update for ID:', noteId);
    const note = await ctx.db.get(noteId);

    if (!note) {
      console.error('❌ [Convex updateNote] Note not found for update:', noteId);
      throw new Error("Note not found");
    }
    if (note.userId !== userId) {
      console.error('🚫 [Convex updateNote] Unauthorized update attempt:', { noteId, requestUserId: userId });
      throw new Error("Unauthorized: You do not own this note.");
    }

    const updateObj = { ...updates, updatedAt: Date.now() };
    
    // DEBUG: Log the exact object being patched
    console.log('📝 [Convex updateNote] Patching note with:', updateObj);
    
    await ctx.db.patch(noteId, updateObj);
    const updatedNote = await ctx.db.get(noteId);

    console.log('✅ [Convex updateNote] Note updated successfully:', updatedNote);
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