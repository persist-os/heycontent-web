/**
 * A2A (Agent-to-Agent) Notes Queries
 * 
 * Query agent network communication notes.
 */
import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get latest A2A notes with optional filtering
 */
export const getLatestA2ANotes = internalQuery({
  args: {
    conversationId: v.optional(v.string()),
    projectId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { conversationId, projectId, limit = 5 }) => {
    // Build query with appropriate index - can't reassign query variable due to TypeScript types
    if (conversationId) {
      // Filter by conversation
      const notes = await ctx.db.query("a2a_notes")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
        .order("desc")
        .take(limit);
      return notes;
    } else if (projectId) {
      // Filter by project
      const notes = await ctx.db.query("a2a_notes")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .order("desc")
        .take(limit);
      return notes;
    } else {
      // Default: order by creation time
      const notes = await ctx.db.query("a2a_notes")
        .withIndex("by_created")
        .order("desc")
        .take(limit);
      return notes;
    }
  },
});

