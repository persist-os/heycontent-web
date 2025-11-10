import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { 
  contextUsageValidator,
  outputTypeValidator,
  contextItemValidator,
  enrichmentMetadataValidator
} from "./types/contextUsage";

/**
 * Track Context Usage
 * 
 * Records which context items (crystals, shards, notes, conversations) were used
 * for which outputs (chat responses, widget outputs, etc.).
 * 
 * Enables:
 * - Debugging: "Why did AI say X?" → trace to specific context items
 * - Analytics: "Which crystals are most useful?"
 * - Optimization: "Are we fetching items we don't use?"
 */
export const trackContextUsage = mutation({
  args: {
    userId: v.string(),
    outputType: outputTypeValidator,
    outputId: v.string(),
    contextItemsUsed: v.array(contextItemValidator),
    enrichmentMetadata: enrichmentMetadataValidator,
    engagementScore: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    logId: v.optional(v.id("context_usage_logs")),
  }),
  handler: async (ctx, args) => {
    try {
      // Atomic insert
      const logId = await ctx.db.insert("context_usage_logs", {
        userId: args.userId,
        timestamp: Date.now(),
        outputType: args.outputType,
        outputId: args.outputId,
        contextItemsUsed: args.contextItemsUsed,
        enrichmentMetadata: args.enrichmentMetadata,
        engagementScore: args.engagementScore,
        userFeedback: undefined,  // Can be updated later via separate mutation
      });
      
      return { success: true, logId };
    } catch (error) {
      console.error("[trackContextUsage] Error:", error);
      return { success: false };
    }
  },
});

/**
 * Update Engagement Score
 * 
 * Updates the engagement score for a context usage log after it's computed.
 * Used by MAB learning to correlate context with engagement.
 */
export const updateContextUsageEngagement = mutation({
  args: {
    logId: v.id("context_usage_logs"),
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
      console.error("[updateContextUsageEngagement] Error:", error);
      return { success: false };
    }
  },
});

