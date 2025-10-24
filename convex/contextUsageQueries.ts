import { v } from "convex/values";
import { query } from "./_generated/server";
import { outputTypeValidator } from "./types/contextUsage";

/**
 * Get all context usage logs for a user
 */
export const getUserContextUsage = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit }) => {
    const logs = await ctx.db
      .query("context_usage_logs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit || 50);
    
    return logs;
  },
});

/**
 * Get context usage logs by output
 */
export const getContextUsageByOutput = query({
  args: {
    outputType: outputTypeValidator,
    outputId: v.string(),
  },
  handler: async (ctx, { outputType, outputId }) => {
    const logs = await ctx.db
      .query("context_usage_logs")
      .withIndex("by_output", (q) => 
        q.eq("outputType", outputType).eq("outputId", outputId)
      )
      .collect();
    
    return logs;
  },
});

/**
 * Get recent context usage logs (admin/debug view)
 */
export const getRecentContextUsage = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }) => {
    const logs = await ctx.db
      .query("context_usage_logs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit || 20);
    
    return logs;
  },
});

/**
 * Count context usage logs
 */
export const countContextUsageLogs = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db
      .query("context_usage_logs")
      .collect();
    
    return {
      total: logs.length,
      byOutputType: logs.reduce((acc, log) => {
        acc[log.outputType] = (acc[log.outputType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  },
});

