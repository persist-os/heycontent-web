import { v } from "convex/values";
import { query, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Token Dam Queries - Monitoring and status operations for conversation token limits
 * 
 * This module provides queries for monitoring token dam state, including:
 * - Getting current dam status for conversations
 * - Retrieving processing history and analytics
 * - Monitoring token usage statistics
 * - Administrative oversight and reporting
 */

/**
 * Get current dam status for a user
 * 
 * Returns the current token dam state including usage, limits, and processing status.
 * Since there's only one dam per user, this returns the user's overall dam status.
 */
export const getDamStatus = query({
  args: {
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      exists: v.literal(true),
      damStatus: v.union(
        v.literal("open"),
        v.literal("approaching"), 
        v.literal("full"),
        v.literal("blocked")
      ),
      currentTokens: v.number(),
      tokenLimit: v.number(),
      percentageFull: v.number(),
      tokensRemaining: v.number(),
      processingPaused: v.boolean(),
      nextProcessingAllowed: v.optional(v.number()),
      lastMessageTokens: v.optional(v.number()),
      lastUpdated: v.number(),
      createdAt: v.number(),
      accumulatedConversations: v.number(), // Number of conversations contributing to dam
      totalMessageCount: v.number(), // Total number of messages in dam
    }),
    v.object({
      exists: v.literal(false),
      damStatus: v.literal("open"),
      currentTokens: v.literal(0),
      tokenLimit: v.number(),
      percentageFull: v.literal(0),
      tokensRemaining: v.number(),
      processingPaused: v.literal(false),
      accumulatedConversations: v.literal(0),
      totalMessageCount: v.literal(0),
    })
  ),
  handler: async (ctx, args) => {
    // Get user's single dam state
    const damState = await ctx.db
      .query("token_dam_state")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!damState) {
      // No dam state exists yet, return default values with fixed token limit
      // Align with backend: 500 tokens triggers processing, 2000 tokens for user limit
      const tokenLimit = 2000;

      return {
        exists: false as const,
        damStatus: "open" as const,
        currentTokens: 0 as const,
        tokenLimit,
        percentageFull: 0 as const,
        tokensRemaining: tokenLimit,
        processingPaused: false as const,
        accumulatedConversations: 0 as const,
        totalMessageCount: 0 as const,
      };
    }

    return {
      exists: true as const,
      damStatus: damState.damStatus,
      currentTokens: damState.currentTokens,
      tokenLimit: damState.tokenLimit,
      percentageFull: damState.percentageFull,
      tokensRemaining: damState.tokensRemaining,
      processingPaused: damState.processingPaused,
      nextProcessingAllowed: damState.nextProcessingAllowed,
      lastMessageTokens: damState.lastMessageTokens,
      lastUpdated: damState.lastUpdated,
      createdAt: damState.createdAt,
      accumulatedConversations: damState.accumulatedConversations.length,
      totalMessageCount: damState.totalMessageCount,
    };
  },
});

/**
 * Get dam overview showing all conversations contributing to the user's dam
 * 
 * Returns details about the single user dam and all conversations contributing to it.
 */
export const getUserDamOverview = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()), // Limit number of conversations returned
  },
  returns: v.object({
    damExists: v.boolean(),
    damStatus: v.union(
      v.literal("open"),
      v.literal("approaching"), 
      v.literal("full"),
      v.literal("blocked")
    ),
    currentTokens: v.number(),
    tokenLimit: v.number(),
    percentageFull: v.number(),
    processingPaused: v.boolean(),
    totalConversationsInDam: v.number(),
    contributingConversations: v.array(v.object({
      conversationId: v.id("conversations"),
      conversationTitle: v.string(),
      tokensContributed: v.number(),
      messageCount: v.number(),
      lastUpdate: v.number(),
      firstContribution: v.number(),
    })),
    summary: v.object({
      totalTokensUsed: v.number(),
      totalTokenLimit: v.number(),
      percentageFull: v.number(),
      totalMessages: v.number(),
      oldestContribution: v.optional(v.number()),
      newestContribution: v.optional(v.number()),
    }),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Get the user's single dam state
    const damState = await ctx.db
      .query("token_dam_state")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!damState) {
      // No dam exists yet
      const defaultTokenLimit = 2000;
      return {
        damExists: false,
        damStatus: "open" as const,
        currentTokens: 0,
        tokenLimit: defaultTokenLimit,
        percentageFull: 0,
        processingPaused: false,
        totalConversationsInDam: 0,
        contributingConversations: [],
        summary: {
          totalTokensUsed: 0,
          totalTokenLimit: defaultTokenLimit,
          percentageFull: 0,
          totalMessages: 0,
        },
      };
    }

    // Get the conversations contributing to the dam (limited)
    const contributingConversations = damState.accumulatedConversations
      .sort((a, b) => b.lastUpdate - a.lastUpdate) // Sort by most recent first
      .slice(0, limit); // Apply limit

    // Calculate summary statistics
    const oldestContribution = damState.accumulatedConversations.length > 0 
      ? Math.min(...damState.accumulatedConversations.map(c => c.firstContribution))
      : undefined;
    
    const newestContribution = damState.accumulatedConversations.length > 0
      ? Math.max(...damState.accumulatedConversations.map(c => c.lastUpdate))
      : undefined;

    return {
      damExists: true,
      damStatus: damState.damStatus,
      currentTokens: damState.currentTokens,
      tokenLimit: damState.tokenLimit,
      percentageFull: damState.percentageFull,
      processingPaused: damState.processingPaused,
      totalConversationsInDam: damState.accumulatedConversations.length,
      contributingConversations,
      summary: {
        totalTokensUsed: damState.currentTokens,
        totalTokenLimit: damState.tokenLimit,
        percentageFull: damState.percentageFull,
        totalMessages: damState.totalMessageCount,
        oldestContribution,
        newestContribution,
      },
    };
  },
});

/**
 * Get processing history for user's dam
 * 
 * Returns the history of processing events and token usage for monitoring.
 * Can optionally filter by specific conversation.
 */
export const getProcessingHistory = query({
  args: {
    userId: v.string(),
    conversationId: v.optional(v.id("conversations")), // If provided, filter by this conversation
    limit: v.optional(v.number()),
    eventType: v.optional(v.union(
      v.literal("message_processed"),
      v.literal("dam_updated"),
      v.literal("dam_processed"),
      v.literal("processing_paused"),
      v.literal("processing_resumed"),
      v.literal("limit_exceeded"),
      v.literal("manual_trigger")
    )),
  },
  returns: v.object({
    history: v.array(v.object({
      _id: v.id("token_dam_processing_history"),
      conversationId: v.optional(v.id("conversations")),
      conversationTitle: v.optional(v.string()),
      eventType: v.union(
        v.literal("message_processed"),
        v.literal("dam_updated"),
        v.literal("dam_processed"),
        v.literal("processing_paused"),
        v.literal("processing_resumed"),
        v.literal("limit_exceeded"),
        v.literal("manual_trigger")
      ),
      tokensBefore: v.number(),
      tokensAfter: v.number(),
      tokensDelta: v.number(),
      processingAllowed: v.boolean(),
      reasonBlocked: v.optional(v.string()),
      messageContent: v.optional(v.string()),
      timestamp: v.number(),
      requestId: v.optional(v.string()),
      metadata: v.optional(v.any()),
    })),
    totalEvents: v.number(),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Get history events
    let historyEvents = await ctx.db
      .query("token_dam_processing_history")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit + 1); // Take one extra to check if there are more

    // Filter by conversation if specified
    if (args.conversationId) {
      historyEvents = historyEvents.filter(event => 
        event.conversationId === args.conversationId
      );
    }

    // Filter by event type if specified
    if (args.eventType) {
      historyEvents = historyEvents.filter(event => 
        event.eventType === args.eventType
      );
    }

    const hasMore = historyEvents.length > limit;
    if (hasMore) {
      historyEvents = historyEvents.slice(0, limit);
    }


    // Get conversation titles for the events (only for events that have conversationId)
    const conversationIds = [...new Set(
      historyEvents
        .map(event => event.conversationId)
        .filter(id => id !== undefined)
    )];
    const conversations = await Promise.all(
      conversationIds.map(id => ctx.db.get(id))
    );
    const conversationMap = new Map();
    for (const conv of conversations) {
      if (conv) {
        conversationMap.set(conv._id, conv.title);
      }
    }

    // Format the history with conversation titles
    const history = historyEvents.map(event => ({
      _id: event._id,
      conversationId: event.conversationId,
      conversationTitle: event.conversationId ? conversationMap.get(event.conversationId) : undefined,
      eventType: event.eventType,
      tokensBefore: event.tokensBefore,
      tokensAfter: event.tokensAfter,
      tokensDelta: event.tokensDelta,
      processingAllowed: event.processingAllowed,
      reasonBlocked: event.reasonBlocked,
      messageContent: event.messageContent,
      timestamp: event.timestamp,
      requestId: event.requestId,
      metadata: event.metadata,
    }));

    // Get total count (this is approximate for performance)
    const totalEvents = historyEvents.length + (hasMore ? 50 : 0);

    return {
      history,
      totalEvents,
      hasMore,
    };
  },
});

/**
 * Get token usage statistics for a user
 * 
 * Returns aggregated statistics for monitoring usage patterns and trends.
 */
export const getTokenUsageStats = query({
  args: {
    userId: v.string(),
    periodType: v.optional(v.union(
      v.literal("daily"),
      v.literal("weekly"), 
      v.literal("monthly")
    )),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.object({
    stats: v.array(v.object({
      _id: v.id("token_usage_stats"),
      periodType: v.union(
        v.literal("daily"),
        v.literal("weekly"), 
        v.literal("monthly")
      ),
      periodStart: v.number(),
      periodEnd: v.number(),
      totalTokensUsed: v.number(),
      totalMessages: v.number(),
      conversationsActive: v.number(),
      averageTokensPerMessage: v.number(),
      peakTokensPerConversation: v.number(),
      tokenLimit: v.number(),
      percentageUsed: v.number(),
      timesLimitExceeded: v.number(),
      timesPaused: v.number(),
      averageResponseTime: v.optional(v.number()),
      totalProcessingTime: v.optional(v.number()),
      lastUpdated: v.number(),
    })),
    summary: v.object({
      totalTokensAcrossPeriods: v.number(),
      totalMessagesAcrossPeriods: v.number(),
      averageUsagePercentage: v.number(),
      totalLimitExceeded: v.number(),
      totalTimesPaused: v.number(),
      trendDirection: v.union(
        v.literal("increasing"),
        v.literal("decreasing"),
        v.literal("stable"),
        v.literal("insufficient_data")
      ),
    }),
  }),
  handler: async (ctx, args) => {
    const periodType = args.periodType || "daily";
    
    // Build query - get all stats for user, then filter by period type
    const allStats = await ctx.db
      .query("token_usage_stats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter by period type and apply date filters
    let stats = allStats.filter(stat => stat.periodType === periodType);
    
    if (args.startDate || args.endDate) {
      stats = stats.filter(stat => {
        if (args.startDate && stat.periodStart < args.startDate) return false;
        if (args.endDate && stat.periodStart > args.endDate) return false;
        return true;
      });
    }

    // Sort by period start
    stats.sort((a, b) => b.periodStart - a.periodStart);

    // Calculate summary statistics
    const totalTokensAcrossPeriods = stats.reduce((sum, stat) => sum + stat.totalTokensUsed, 0);
    const totalMessagesAcrossPeriods = stats.reduce((sum, stat) => sum + stat.totalMessages, 0);
    const averageUsagePercentage = stats.length > 0 ? 
      stats.reduce((sum, stat) => sum + stat.percentageUsed, 0) / stats.length : 0;
    const totalLimitExceeded = stats.reduce((sum, stat) => sum + stat.timesLimitExceeded, 0);
    const totalTimesPaused = stats.reduce((sum, stat) => sum + stat.timesPaused, 0);

    // Calculate trend direction
    let trendDirection: "increasing" | "decreasing" | "stable" | "insufficient_data";
    if (stats.length < 2) {
      trendDirection = "insufficient_data";
    } else {
      const recentPeriods = stats.slice(0, Math.min(3, stats.length));
      const olderPeriods = stats.slice(-Math.min(3, stats.length));
      
      const recentAverage = recentPeriods.reduce((sum, stat) => sum + stat.totalTokensUsed, 0) / recentPeriods.length;
      const olderAverage = olderPeriods.reduce((sum, stat) => sum + stat.totalTokensUsed, 0) / olderPeriods.length;
      
      const changePct = olderAverage > 0 ? ((recentAverage - olderAverage) / olderAverage) * 100 : 0;
      
      if (Math.abs(changePct) < 10) {
        trendDirection = "stable";
      } else if (changePct > 0) {
        trendDirection = "increasing";
      } else {
        trendDirection = "decreasing";
      }
    }

    return {
      stats,
      summary: {
        totalTokensAcrossPeriods,
        totalMessagesAcrossPeriods,
        averageUsagePercentage,
        totalLimitExceeded,
        totalTimesPaused,
        trendDirection,
      },
    };
  },
});

/**
 * Get dam status if it needs attention due to token limit issues
 * 
 * Returns the dam state if it needs attention, along with contributing conversations.
 */
export const getDamNeedingAttention = query({
  args: {
    userId: v.string(),
    statusFilter: v.optional(v.union(
      v.literal("blocked"),
      v.literal("approaching_or_blocked"),
      v.literal("all_limited")
    )),
  },
  returns: v.union(
    v.object({
      needsAttention: v.literal(false),
    }),
    v.object({
      needsAttention: v.literal(true),
      damStatus: v.union(
        v.literal("approaching"), 
        v.literal("full"),
        v.literal("blocked")
      ),
      currentTokens: v.number(),
      tokenLimit: v.number(),
      percentageFull: v.number(),
      processingPaused: v.boolean(),
      nextProcessingAllowed: v.optional(v.number()),
      lastUpdated: v.number(),
      timeUntilResume: v.optional(v.number()),
      contributingConversations: v.array(v.object({
        conversationId: v.id("conversations"),
        conversationTitle: v.string(),
        tokensContributed: v.number(),
        messageCount: v.number(),
        lastUpdate: v.number(),
      })),
    })
  ),
  handler: async (ctx, args) => {
    const statusFilter = args.statusFilter || "approaching_or_blocked";
    const now = Date.now();

    // Get the user's single dam state
    const damState = await ctx.db
      .query("token_dam_state")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!damState) {
      return { needsAttention: false as const };
    }

    // Check if dam needs attention based on status filter
    let needsAttention = false;
    switch (statusFilter) {
      case "blocked":
        needsAttention = damState.damStatus === "blocked";
        break;
      case "approaching_or_blocked":
        needsAttention = damState.damStatus === "approaching" || 
                         damState.damStatus === "full" || 
                         damState.damStatus === "blocked";
        break;
      case "all_limited":
        needsAttention = damState.damStatus !== "open";
        break;
    }

    if (!needsAttention) {
      return { needsAttention: false as const };
    }

    const timeUntilResume = damState.nextProcessingAllowed && damState.nextProcessingAllowed > now
      ? damState.nextProcessingAllowed - now
      : undefined;

    // Sort contributing conversations by tokens contributed (highest first)
    const contributingConversations = damState.accumulatedConversations
      .sort((a, b) => b.tokensContributed - a.tokensContributed);

    return {
      needsAttention: true as const,
      damStatus: damState.damStatus as "approaching" | "full" | "blocked",
      currentTokens: damState.currentTokens,
      tokenLimit: damState.tokenLimit,
      percentageFull: damState.percentageFull,
      processingPaused: damState.processingPaused,
      nextProcessingAllowed: damState.nextProcessingAllowed,
      lastUpdated: damState.lastUpdated,
      timeUntilResume,
      contributingConversations,
    };
  },
});

/**
 * Check if processing is allowed for a user's dam
 * 
 * Quick check to determine if the user's dam can process new messages.
 */
export const isProcessingAllowed = query({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    allowed: v.boolean(),
    damStatus: v.union(
      v.literal("open"),
      v.literal("approaching"), 
      v.literal("full"),
      v.literal("blocked")
    ),
    reasonBlocked: v.optional(v.string()),
    timeUntilAllowed: v.optional(v.number()),
    currentTokens: v.number(),
    tokenLimit: v.number(),
    percentageFull: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get user's single dam state
    const damState = await ctx.db
      .query("token_dam_state")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!damState) {
      // No dam state exists, processing is allowed
      // Fixed token limit aligned with backend dam pattern
      const tokenLimit = 2000;

      return {
        allowed: true,
        damStatus: "open" as const,
        currentTokens: 0,
        tokenLimit,
        percentageFull: 0,
      };
    }

    let allowed = true;
    let reasonBlocked: string | undefined;
    let timeUntilAllowed: number | undefined;

    // Check if processing is paused
    if (damState.processingPaused) {
      allowed = false;
      reasonBlocked = "Processing is paused";
    }

    // Check if we're over the token limit
    if (damState.damStatus === "blocked") {
      allowed = false;
      reasonBlocked = "Token limit exceeded";
    }

    // Check if we're in a cooldown period
    if (damState.nextProcessingAllowed && now < damState.nextProcessingAllowed) {
      allowed = false;
      reasonBlocked = `Processing paused until ${new Date(damState.nextProcessingAllowed).toISOString()}`;
      timeUntilAllowed = damState.nextProcessingAllowed - now;
    }

    return {
      allowed,
      damStatus: damState.damStatus,
      reasonBlocked,
      timeUntilAllowed,
      currentTokens: damState.currentTokens,
      tokenLimit: damState.tokenLimit,
      percentageFull: damState.percentageFull,
    };
  },
});

/**
 * Internal query to get dam states for batch processing
 * 
 * Used internally for maintenance and batch operations.
 */
export const getDamStatesForProcessing = internalQuery({
  args: {
    statusFilter: v.optional(v.union(
      v.literal("blocked"),
      v.literal("paused"),
      v.literal("ready_to_resume")
    )),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("token_dam_state"),
    userId: v.string(),
    damStatus: v.union(
      v.literal("open"),
      v.literal("approaching"), 
      v.literal("full"),
      v.literal("blocked")
    ),
    currentTokens: v.number(),
    tokenLimit: v.number(),
    processingPaused: v.boolean(),
    nextProcessingAllowed: v.optional(v.number()),
    lastUpdated: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const now = Date.now();

    // Apply filters
    switch (args.statusFilter) {
      case "blocked":
        const blockedStates = await ctx.db
          .query("token_dam_state")
          .withIndex("by_status", (q) => q.eq("damStatus", "blocked"))
          .take(limit);
        
        return blockedStates.map(state => ({
          _id: state._id,
          userId: state.userId,
          damStatus: state.damStatus,
          currentTokens: state.currentTokens,
          tokenLimit: state.tokenLimit,
          processingPaused: state.processingPaused,
          nextProcessingAllowed: state.nextProcessingAllowed,
          lastUpdated: state.lastUpdated,
        }));
        
      case "paused":
        const pausedStates = await ctx.db
          .query("token_dam_state")
          .withIndex("by_processing_paused", (q) => q.eq("processingPaused", true))
          .take(limit);
        
        return pausedStates.map(state => ({
          _id: state._id,
          userId: state.userId,
          damStatus: state.damStatus,
          currentTokens: state.currentTokens,
          tokenLimit: state.tokenLimit,
          processingPaused: state.processingPaused,
          nextProcessingAllowed: state.nextProcessingAllowed,
          lastUpdated: state.lastUpdated,
        }));
        
      case "ready_to_resume":
        // Get paused states where cooldown has expired
        const readyStates = await ctx.db
          .query("token_dam_state")
          .withIndex("by_processing_paused", (q) => q.eq("processingPaused", true))
          .collect();
        
        return readyStates
          .filter(state => 
            !state.nextProcessingAllowed || state.nextProcessingAllowed <= now
          )
          .slice(0, limit)
          .map(state => ({
            _id: state._id,
            userId: state.userId,
            damStatus: state.damStatus,
            currentTokens: state.currentTokens,
            tokenLimit: state.tokenLimit,
            processingPaused: state.processingPaused,
            nextProcessingAllowed: state.nextProcessingAllowed,
            lastUpdated: state.lastUpdated,
          }));
          
      default:
        // Get all states
        const allStates = await ctx.db
          .query("token_dam_state")
          .take(limit);
        
        return allStates.map(state => ({
          _id: state._id,
          userId: state.userId,
          damStatus: state.damStatus,
          currentTokens: state.currentTokens,
          tokenLimit: state.tokenLimit,
          processingPaused: state.processingPaused,
          nextProcessingAllowed: state.nextProcessingAllowed,
          lastUpdated: state.lastUpdated,
        }));
    }
  },
});
