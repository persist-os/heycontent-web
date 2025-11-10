import { v } from "convex/values";
import { query } from "./_generated/server";
import { outputTypeValidator, getUsageLogsRequestValidator } from "./types/contextUsage";

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
 * Get context usage logs with time window filtering
 * Used by fitness calculator for natural selection evolution
 */
export const getUsageLogs = query({
  args: getUsageLogsRequestValidator,
  handler: async (ctx, { userId, startTime, endTime, limit, outputType }) => {
    try {
      let query = ctx.db
        .query("context_usage_logs")
        .withIndex("by_user_and_time", (q) => q.eq("userId", userId));
      
      // Apply time filtering if provided
      if (startTime !== undefined) {
        query = query.filter((q) => q.gte(q.field("timestamp"), startTime));
      }
      if (endTime !== undefined) {
        query = query.filter((q) => q.lte(q.field("timestamp"), endTime));
      }
      
      // Apply output type filtering if provided
      if (outputType !== undefined) {
        query = query.filter((q) => q.eq(q.field("outputType"), outputType));
      }
      
      const logs = await query
        .order("desc")
        .take(limit || 50);
      
      return {
        success: true,
        data: logs,
        message: `Retrieved ${logs.length} usage logs`
      };
    } catch (error) {
      console.error("[getUsageLogs] Error:", error);
      return {
        success: false,
        error: `Failed to get usage logs: ${error}`,
        data: []
      };
    }
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

/**
 * Get context usage with feedback correlation (for analytics)
 * Shows which context items are associated with highly-rated vs low-rated outputs
 */
export const getContextUsageWithFeedback = query({
  args: {
    outputType: v.optional(outputTypeValidator),
    minRating: v.optional(v.number()),
    maxRating: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { outputType, minRating, maxRating, limit }) => {
    let logs;

    if (outputType) {
      // Use the by_output index and filter by outputType
      logs = await ctx.db
        .query("context_usage_logs")
        .withIndex("by_output", (q) =>
          q.eq("outputType", outputType as any)
        )
        .order("desc")
        .take(limit || 100);
    } else {
      // Use timestamp index for general queries
      logs = await ctx.db
        .query("context_usage_logs")
        .withIndex("by_timestamp")
        .order("desc")
        .take(limit || 100);
    }

    // Filter by rating if specified
    let filteredLogs = logs;
    if (minRating !== undefined || maxRating !== undefined) {
      filteredLogs = logs.filter(log => {
        if (!log.userFeedback) return false;

        // Extract rating from feedback text (format: "Rated X/5" or "User rated ... as X out of 5")
        const ratingMatch = log.userFeedback.match(/(\d+)\/5|rated.*as (\d+)/i);
        if (!ratingMatch) return false;

        const rating = parseInt(ratingMatch[1] || ratingMatch[2]);
        if (minRating !== undefined && rating < minRating) return false;
        if (maxRating !== undefined && rating > maxRating) return false;

        return true;
      });
    }

    return filteredLogs.map(log => ({
      ...log,
      // Extract rating for easier analysis
      extractedRating: log.userFeedback ?
        (log.userFeedback.match(/(\d+)\/5|rated.*as (\d+)/i)?.[1] || log.userFeedback.match(/(\d+)\/5|rated.*as (\d+)/i)?.[2]) || null
        : null,
    }));
  },
});

