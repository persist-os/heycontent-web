import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { 
  toolCallValidator,
  sessionTypeValidator,
  toolCallItemValidator
} from "./types/toolCall";

/**
 * Track Tool Calls
 * 
 * Records which tools were called during agent runs.
 * 
 * Enables:
 * - Debugging: "Why did orchestrator create THIS widget?" → trace to specific tool calls
 * - Analytics: "Which tools are most effective?"
 * - Optimization: "Are agents calling tools unnecessarily?"
 * 
 * Pattern: Copied from contextUsageMutations.ts (LAW I - COPY)
 */
export const trackToolCalls = mutation({
  args: {
    userId: v.string(),
    agentType: v.string(),
    runId: v.string(),
    sessionId: v.string(),
    sessionType: sessionTypeValidator,
    toolsCalled: v.array(toolCallItemValidator),
    totalToolsCalled: v.number(),
    successfulCalls: v.number(),
    failedCalls: v.number(),
    engagementScore: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    logId: v.optional(v.id("tool_call_logs")),
  }),
  handler: async (ctx, args) => {
    try {
      // Atomic insert
      const logId = await ctx.db.insert("tool_call_logs", {
        userId: args.userId,
        timestamp: Date.now(),
        agentType: args.agentType,
        runId: args.runId,
        sessionId: args.sessionId,
        sessionType: args.sessionType,
        toolsCalled: args.toolsCalled,
        totalToolsCalled: args.totalToolsCalled,
        successfulCalls: args.successfulCalls,
        failedCalls: args.failedCalls,
        engagementScore: args.engagementScore,
      });
      
      return { success: true, logId };
    } catch (error) {
      console.error("[trackToolCalls] Error:", error);
      return { success: false };
    }
  },
});

/**
 * Update Engagement Score
 * 
 * Updates the engagement score for a tool call log after it's computed.
 * Used by MAB learning to correlate tool usage with engagement.
 */
export const updateToolCallEngagement = mutation({
  args: {
    logId: v.id("tool_call_logs"),
    engagementScore: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, { logId, engagementScore }) => {
    try {
      await ctx.db.patch(logId, { engagementScore });
      return { success: true };
    } catch (error) {
      console.error("[updateToolCallEngagement] Error:", error);
      return { success: false };
    }
  },
});

