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