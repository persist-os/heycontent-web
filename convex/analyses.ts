import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Create a new noteAnalysis
export const createNoteAnalysis = mutation({
  args: {
    noteId: v.string(),
    platform: v.string(),
    output: v.optional(v.any()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if the referenced note exists
    const note = await ctx.db.get(args.noteId as Id<"notes">);
    if (!note) {
      throw new Error(`Cannot create analysis: note with id ${args.noteId} does not exist.`);
    }
    const noteAnalysisId = await ctx.db.insert("notesAnalyses", args);
    return noteAnalysisId;
  },
});

// Get all notesAnalyses for a note
export const getAnalysesByNote = query({
  args: { noteId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notesAnalyses")
      .withIndex("by_noteId", (q) => q.eq("noteId", args.noteId))
      .collect();
  },
});

// Get analyses by user ID (finds all analyses for notes belonging to a user)
export const getAnalysesByUser = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // First get all notes for this user
    const userNotes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Get note IDs
    const noteIds = userNotes.map(note => note._id);
    
    // Get all analyses for these notes
    const analyses = [];
    for (const noteId of noteIds) {
      const noteAnalyses = await ctx.db
        .query("notesAnalyses")
        .withIndex("by_noteId", (q) => q.eq("noteId", noteId))
        .collect();
      analyses.push(...noteAnalyses);
    }
    
    // Sort by creation date (most recent first) and apply limit
    const sortedAnalyses = analyses
      .sort((a, b) => b.createdAt - a.createdAt);
    
    return args.limit ? sortedAnalyses.slice(0, args.limit) : sortedAnalyses;
  },
});

// Get analyses by user and platform
export const getAnalysesByUserPlatform = query({
  args: { 
    userId: v.string(),
    platform: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // First get all notes for this user with the specified platform
    const userNotes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("platform"), args.platform))
      .collect();
    
    // Get note IDs
    const noteIds = userNotes.map(note => note._id);
    
    // Get all analyses for these notes with the specified platform
    const analyses = [];
    for (const noteId of noteIds) {
      const noteAnalyses = await ctx.db
        .query("notesAnalyses")
        .withIndex("by_noteId", (q) => q.eq("noteId", noteId))
        .filter((q) => q.eq(q.field("platform"), args.platform))
        .collect();
      analyses.push(...noteAnalyses);
    }
    
    // Sort by creation date (most recent first) and apply limit
    const sortedAnalyses = analyses
      .sort((a, b) => b.createdAt - a.createdAt);
    
    return args.limit ? sortedAnalyses.slice(0, args.limit) : sortedAnalyses;
  },
});

// Update a note with an analysisId (link analysis to note)
export const linkAnalysisToNote = mutation({
  args: {
    noteId: v.string(),
    analysisId: v.string(),
    userId: v.string(), // For authorization
  },
  handler: async (ctx, args) => {
    // Check if note exists and user owns it
    const note = await ctx.db.get(args.noteId as Id<"notes">);
    if (!note) {
      throw new Error("Note not found");
    }
    if (note.userId !== args.userId) {
      throw new Error("Unauthorized: You do not own this note");
    }
    
    // Check if analysis exists
    const analysis = await ctx.db.get(args.analysisId as Id<"notesAnalyses">);
    if (!analysis) {
      throw new Error("Analysis not found");
    }
    
    // Update the note with the analysisId (add to schema or use a new field)
    // For now, we'll store it in a custom field
    await ctx.db.patch(args.noteId as Id<"notes">, {
      analysisId: args.analysisId,
      updatedAt: Date.now()
    });
    
    return { success: true };
  },
});
