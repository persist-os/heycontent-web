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
 * Get current dam status for a conversation
 * 
 * Returns the current token dam state including usage, limits, and processing status.
 */
export const getDamStatus = query({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
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
    }),
    v.object({
      exists: v.literal(false),
      damStatus: v.literal("open"),
      currentTokens: v.literal(0),
      tokenLimit: v.number(),
      percentageFull: v.literal(0),
      tokensRemaining: v.number(),
      processingPaused: v.literal(false),
    })
  ),
  handler: async (ctx, args) => {
    // Validate conversation exists and belongs to user
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    if (conversation.userId !== args.userId) {
      throw new Error("Conversation does not belong to user");
    }

    // Get dam state for this conversation
    const damState = await ctx.db
      .query("token_dam_state")
      .withIndex("by_user_conversation", (q) => 
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .first();

    if (!damState) {
      // No dam state exists yet, return default values
      const user = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .first();
      
      const tokenLimit = user?.subscription ? 
        (user.subscription.includedRequests || 100) * 1000 : 100000;

      return {
        exists: false as const,
        damStatus: "open" as const,
        currentTokens: 0 as const,
        tokenLimit,
        percentageFull: 0 as const,
        tokensRemaining: tokenLimit,
        processingPaused: false as const,
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
    };
  },
});

/**
 * Get dam status for all conversations for a user
 * 
 * Returns a summary of token dam states across all user conversations.
 */
export const getUserDamOverview = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()), // Limit number of conversations returned
  },
  returns: v.object({
    totalConversations: v.number(),
    conversationsWithLimits: v.number(),
    overallStatus: v.union(
      v.literal("all_open"),
      v.literal("some_approaching"),
      v.literal("some_blocked"),
      v.literal("many_blocked")
    ),
    conversations: v.array(v.object({
      conversationId: v.id("conversations"),
      conversationTitle: v.string(),
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
      lastUpdated: v.number(),
    })),
    summary: v.object({
      totalTokensUsed: v.number(),
      totalTokenLimit: v.number(),
      averagePercentageFull: v.number(),
      blockedCount: v.number(),
      approachingCount: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Get all conversations for the user
    const allConversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Get all dam states for the user
    const allDamStates = await ctx.db
      .query("token_dam_state")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Create a map for quick lookup
    const damStateMap = new Map();
    for (const damState of allDamStates) {
      damStateMap.set(damState.conversationId, damState);
    }

    // Get user's default token limit
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    const defaultTokenLimit = user?.subscription ? 
      (user.subscription.includedRequests || 100) * 1000 : 100000;

    const conversations = [];
    let totalTokensUsed = 0;
    let totalTokenLimit = 0;
    let blockedCount = 0;
    let approachingCount = 0;

    for (const conversation of allConversations) {
      const damState = damStateMap.get(conversation._id);
      
      if (damState) {
        conversations.push({
          conversationId: conversation._id,
          conversationTitle: conversation.title,
          damStatus: damState.damStatus,
          currentTokens: damState.currentTokens,
          tokenLimit: damState.tokenLimit,
          percentageFull: damState.percentageFull,
          processingPaused: damState.processingPaused,
          lastUpdated: damState.lastUpdated,
        });

        totalTokensUsed += damState.currentTokens;
        totalTokenLimit += damState.tokenLimit;

        if (damState.damStatus === "blocked") blockedCount++;
        else if (damState.damStatus === "approaching" || damState.damStatus === "full") approachingCount++;
      } else {
        // Conversation has no dam state yet
        conversations.push({
          conversationId: conversation._id,
          conversationTitle: conversation.title,
          damStatus: "open" as const,
          currentTokens: 0,
          tokenLimit: defaultTokenLimit,
          percentageFull: 0,
          processingPaused: false,
          lastUpdated: conversation.updatedAt,
        });

        totalTokenLimit += defaultTokenLimit;
      }
    }

    // Determine overall status
    let overallStatus: "all_open" | "some_approaching" | "some_blocked" | "many_blocked";
    if (blockedCount > conversations.length * 0.3) {
      overallStatus = "many_blocked";
    } else if (blockedCount > 0) {
      overallStatus = "some_blocked";
    } else if (approachingCount > 0) {
      overallStatus = "some_approaching";
    } else {
      overallStatus = "all_open";
    }

    const averagePercentageFull = conversations.length > 0 ? 
      conversations.reduce((sum, conv) => sum + conv.percentageFull, 0) / conversations.length : 0;

    return {
      totalConversations: allConversations.length,
      conversationsWithLimits: allDamStates.length,
      overallStatus,
      conversations,
      summary: {
        totalTokensUsed,
        totalTokenLimit,
        averagePercentageFull,
        blockedCount,
        approachingCount,
      },
    };
  },
});

/**
 * Get processing history for a conversation
 * 
 * Returns the history of processing events and token usage for monitoring.
 */
export const getProcessingHistory = query({
  args: {
    userId: v.string(),
    conversationId: v.optional(v.id("conversations")), // If not provided, get all user history
    limit: v.optional(v.number()),
    eventType: v.optional(v.union(
      v.literal("message_processed"),
      v.literal("dam_updated"),
      v.literal("processing_paused"),
      v.literal("processing_resumed"),
      v.literal("limit_exceeded"),
      v.literal("manual_trigger")
    )),
  },
  returns: v.object({
    history: v.array(v.object({
      _id: v.id("token_dam_processing_history"),
      conversationId: v.id("conversations"),
      conversationTitle: v.optional(v.string()),
      eventType: v.union(
        v.literal("message_processed"),
        v.literal("dam_updated"),
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

    // Build query based on filters
    let query = ctx.db.query("token_dam_processing_history");
    
    if (args.conversationId) {
      query = query.withIndex("by_conversation_timestamp", (q) => 
        q.eq("conversationId", args.conversationId)
      );
    } else {
      query = query.withIndex("by_user_timestamp", (q) => 
        q.eq("userId", args.userId)
      );
    }

    // Get history events
    let historyEvents = await query
      .order("desc")
      .take(limit + 1); // Take one extra to check if there are more

    // Filter by event type if specified
    if (args.eventType) {
      historyEvents = historyEvents.filter(event => event.eventType === args.eventType);
    }

    const hasMore = historyEvents.length > limit;
    if (hasMore) {
      historyEvents = historyEvents.slice(0, limit);
    }

    // Get conversation titles for the events
    const conversationIds = [...new Set(historyEvents.map(event => event.conversationId))];
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
      conversationTitle: conversationMap.get(event.conversationId),
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
    
    // Build query
    let query = ctx.db
      .query("token_usage_stats")
      .withIndex("by_user_period", (q) => 
        q.eq("userId", args.userId).eq("periodType", periodType)
      );

    // Apply date filters if provided
    let stats = await query.collect();
    
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
 * Get conversations that are currently blocked or approaching limits
 * 
 * Returns conversations that need attention due to token limit issues.
 */
export const getConversationsNeedingAttention = query({
  args: {
    userId: v.string(),
    statusFilter: v.optional(v.union(
      v.literal("blocked"),
      v.literal("approaching_or_blocked"),
      v.literal("all_limited")
    )),
  },
  returns: v.array(v.object({
    conversationId: v.id("conversations"),
    conversationTitle: v.string(),
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
  })),
  handler: async (ctx, args) => {
    const statusFilter = args.statusFilter || "approaching_or_blocked";
    const now = Date.now();

    // Get dam states that need attention
    let damStates = await ctx.db
      .query("token_dam_state")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter based on status
    switch (statusFilter) {
      case "blocked":
        damStates = damStates.filter(state => state.damStatus === "blocked");
        break;
      case "approaching_or_blocked":
        damStates = damStates.filter(state => 
          state.damStatus === "approaching" || state.damStatus === "full" || state.damStatus === "blocked"
        );
        break;
      case "all_limited":
        damStates = damStates.filter(state => state.damStatus !== "open");
        break;
    }

    // Get conversation titles
    const conversationIds = damStates.map(state => state.conversationId);
    const conversations = await Promise.all(
      conversationIds.map(id => ctx.db.get(id))
    );

    const results = [];
    for (let i = 0; i < damStates.length; i++) {
      const damState = damStates[i];
      const conversation = conversations[i];
      
      if (conversation) {
        const timeUntilResume = damState.nextProcessingAllowed && damState.nextProcessingAllowed > now
          ? damState.nextProcessingAllowed - now
          : undefined;

        results.push({
          conversationId: damState.conversationId,
          conversationTitle: conversation.title,
          damStatus: damState.damStatus as "approaching" | "full" | "blocked",
          currentTokens: damState.currentTokens,
          tokenLimit: damState.tokenLimit,
          percentageFull: damState.percentageFull,
          processingPaused: damState.processingPaused,
          nextProcessingAllowed: damState.nextProcessingAllowed,
          lastUpdated: damState.lastUpdated,
          timeUntilResume,
        });
      }
    }

    // Sort by most critical first (highest percentage, then most recent)
    results.sort((a, b) => {
      if (a.percentageFull !== b.percentageFull) {
        return b.percentageFull - a.percentageFull;
      }
      return b.lastUpdated - a.lastUpdated;
    });

    return results;
  },
});

/**
 * Check if processing is allowed for a conversation
 * 
 * Quick check to determine if a conversation can process new messages.
 */
export const isProcessingAllowed = query({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
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

    // Get dam state
    const damState = await ctx.db
      .query("token_dam_state")
      .withIndex("by_user_conversation", (q) => 
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .first();

    if (!damState) {
      // No dam state exists, processing is allowed
      const user = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .first();
      
      const tokenLimit = user?.subscription ? 
        (user.subscription.includedRequests || 100) * 1000 : 100000;

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
    conversationId: v.id("conversations"),
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

    let query = ctx.db.query("token_dam_state");

    // Apply filters
    switch (args.statusFilter) {
      case "blocked":
        query = query.withIndex("by_status", (q) => q.eq("damStatus", "blocked"));
        break;
      case "paused":
        query = query.withIndex("by_processing_paused", (q) => q.eq("processingPaused", true));
        break;
      case "ready_to_resume":
        // Get paused states where cooldown has expired
        const pausedStates = await ctx.db
          .query("token_dam_state")
          .withIndex("by_processing_paused", (q) => q.eq("processingPaused", true))
          .collect();
        
        return pausedStates
          .filter(state => 
            !state.nextProcessingAllowed || state.nextProcessingAllowed <= now
          )
          .slice(0, limit)
          .map(state => ({
            _id: state._id,
            userId: state.userId,
            conversationId: state.conversationId,
            damStatus: state.damStatus,
            currentTokens: state.currentTokens,
            tokenLimit: state.tokenLimit,
            processingPaused: state.processingPaused,
            nextProcessingAllowed: state.nextProcessingAllowed,
            lastUpdated: state.lastUpdated,
          }));
    }

    const states = await query.take(limit);

    return states.map(state => ({
      _id: state._id,
      userId: state.userId,
      conversationId: state.conversationId,
      damStatus: state.damStatus,
      currentTokens: state.currentTokens,
      tokenLimit: state.tokenLimit,
      processingPaused: state.processingPaused,
      nextProcessingAllowed: state.nextProcessingAllowed,
      lastUpdated: state.lastUpdated,
    }));
  },
});
