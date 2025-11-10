/**
 * A2A (Agent-to-Agent) Notes Mutations
 * 
 * Store and manage agent network communication notes.
 */
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Store A2A note for agent network
 */
export const storeA2ANote = internalMutation({
  args: {
    agentId: v.string(),
    report: v.any(),
    conversationId: v.optional(v.string()),
    projectId: v.optional(v.string()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const noteId = await ctx.db.insert("a2a_notes", {
      agentId: args.agentId,
      report: args.report,
      conversationId: args.conversationId,
      projectId: args.projectId,
      createdAt: args.createdAt,
    });
    
    return noteId;
  },
});

