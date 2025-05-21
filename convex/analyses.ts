import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
