import { v } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Token Dam Mutations - State management for conversation token limits
 * 
 * This module provides mutations for managing token dam state, including:
 * - Creating and updating dam state for conversations
 * - Processing token consumption and limit enforcement
 * - Managing processing pause/resume functionality
 * - Recording processing history for monitoring
 */

/**
 * Update or create user's token dam state when tokens are consumed
 * 
 * This is the primary mutation for updating the single user dam state.
 * It accumulates tokens across all conversations and triggers processing when limits are reached.
 */
export const updateDamState = mutation({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
    tokensUsed: v.number(), // Tokens consumed in this update
    tokenLimit: v.optional(v.number()), // User's current token limit (if changed)
    requestId: v.optional(v.string()), // For tracking/debugging
  },
  returns: v.object({
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
    shouldTriggerProcessing: v.boolean(), // Whether dam reached threshold
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Validate conversation exists and belongs to user
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    if (conversation.userId !== args.userId) {
      throw new Error("Conversation does not belong to user");
    }

    // Get user's current token limit from subscription if not provided
    let tokenLimit = args.tokenLimit;
    if (!tokenLimit) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .first();
      
      if (!user?.subscription) {
        throw new Error("User subscription not found");
      }
      
      // Calculate reasonable token limit for dam pattern (reduced multiplier)
      const subscriptionLimit = (user.subscription.includedRequests || 100) * 10;
      tokenLimit = Math.min(subscriptionLimit, 5000); // Cap at 5000 tokens for effective dam operation
    }

    // Find existing user dam state (single dam per user)
    const existingDamState = await ctx.db
      .query("token_dam_state")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const previousTokens = existingDamState?.currentTokens || 0;
    const previousMessageCount = existingDamState?.totalMessageCount || 
      // If totalMessageCount doesn't exist, calculate from accumulated conversations
      (existingDamState?.accumulatedConversations?.reduce((total, conv) => total + ((conv as any).messageCount || 0), 0) || 0);
    const newCurrentTokens = Math.max(0, previousTokens + args.tokensUsed);
    const newTotalMessageCount = previousMessageCount + 1; // Each update adds one message
    const percentageFull = Math.min(100, (newCurrentTokens / tokenLimit) * 100);
    const tokensRemaining = Math.max(0, tokenLimit - newCurrentTokens);

    // Update accumulated conversations
    const accumulatedConversations = existingDamState?.accumulatedConversations || [];
    const existingConvIndex = accumulatedConversations.findIndex(
      conv => conv.conversationId === args.conversationId
    );

    if (existingConvIndex >= 0) {
      // Update existing conversation contribution
      accumulatedConversations[existingConvIndex] = {
        ...accumulatedConversations[existingConvIndex],
        tokensContributed: accumulatedConversations[existingConvIndex].tokensContributed + args.tokensUsed,
        messageCount: (accumulatedConversations[existingConvIndex].messageCount || 0) + 1, // Increment message count (handle migration)
        lastUpdate: now
      };
    } else {
      // Add new conversation to accumulation
      accumulatedConversations.push({
        conversationId: args.conversationId,
        conversationTitle: conversation.title, // ADD THIS
        tokensContributed: args.tokensUsed,
        messageCount: 1,
        lastUpdate: now,
        firstContribution: now 
      });
    }

    // Determine dam status based on percentage
    let damStatus: "open" | "approaching" | "full" | "blocked";
    let shouldTriggerProcessing = false;

    if (percentageFull >= 100) {
      damStatus = "blocked";
      shouldTriggerProcessing = true;
    } else if (percentageFull >= 95) {
      damStatus = "full";
      shouldTriggerProcessing = true;
    } else if (percentageFull >= 80) {
      damStatus = "approaching";
    } else {
      damStatus = "open";
    }

    // Check if we've reached the accumulation threshold (align with backend PERSONA_TRACE_TOKEN_LIMIT)
    const DAM_THRESHOLD = 500;
    if (newCurrentTokens >= DAM_THRESHOLD && !shouldTriggerProcessing) {
      shouldTriggerProcessing = true;
    }

    const processingPaused = damStatus === "blocked";
    const nextProcessingAllowed = processingPaused ? now + (60 * 60 * 1000) : undefined; // 1 hour cooldown

    const damStateData = {
      userId: args.userId,
      currentTokens: newCurrentTokens,
      tokenLimit,
      damStatus,
      percentageFull,
      tokensRemaining,
      lastMessageTokens: args.tokensUsed,
      totalMessageCount: newTotalMessageCount,
      lastUpdated: now,
      processingPaused,
      nextProcessingAllowed,
      accumulatedConversations,
    };

    let damStateId: Id<"token_dam_state">;

    if (existingDamState) {
      // Update existing dam state
      await ctx.db.patch(existingDamState._id, damStateData);
      damStateId = existingDamState._id;
    } else {
      // Create new dam state
      damStateId = await ctx.db.insert("token_dam_state", {
        ...damStateData,
        createdAt: now,
      });
    }

    // Record processing history
    await ctx.db.insert("token_dam_processing_history", {
      userId: args.userId,
      conversationId: args.conversationId,
      damStateId,
      eventType: "dam_updated",
      tokensBefore: previousTokens,
      tokensAfter: newCurrentTokens,
      tokensDelta: args.tokensUsed,
      processingAllowed: !processingPaused,
      reasonBlocked: processingPaused ? "Token limit exceeded" : undefined,
      timestamp: now,
      requestId: args.requestId,
    });

    console.log(`[TokenDam] Updated user dam for ${args.userId}: ${damStatus} (${percentageFull.toFixed(1)}% full, ${newCurrentTokens} tokens), shouldTrigger: ${shouldTriggerProcessing}`);

    return {
      damStatus,
      currentTokens: newCurrentTokens,
      tokenLimit,
      percentageFull,
      tokensRemaining,
      processingPaused,
      shouldTriggerProcessing,
    };
  },
});

/**
 * Process and drain the user's token dam
 * 
 * This function is called when the dam reaches its threshold.
 * It processes the accumulated conversations and resets the dam.
 */
export const processDam = mutation({
  args: {
    userId: v.string(),
    requestId: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    tokensProcessed: v.number(),
    conversationsProcessed: v.number(),
    damDrained: v.boolean(),
    nextDamState: v.object({
      currentTokens: v.number(),
      damStatus: v.union(
        v.literal("open"),
        v.literal("approaching"), 
        v.literal("full"),
        v.literal("blocked")
      ),
    }),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get current dam state
    const damState = await ctx.db
      .query("token_dam_state")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!damState) {
      throw new Error("No dam state found for user");
    }

    const tokensProcessed = damState.currentTokens;
    const conversationsProcessed = damState.accumulatedConversations.length;

    console.log(`[TokenDam] Processing dam for user ${args.userId}: ${tokensProcessed} tokens, ${conversationsProcessed} conversations`);

    // Record processing event
    await ctx.db.insert("token_dam_processing_history", {
      userId: args.userId,
      damStateId: damState._id,
      eventType: "dam_processed",
      tokensBefore: tokensProcessed,
      tokensAfter: 0, // Dam will be drained
      tokensDelta: -tokensProcessed,
      processingAllowed: true,
      timestamp: now,
      requestId: args.requestId,
    });

    // Drain the dam - reset to empty state
    const drainedDamState = {
      currentTokens: 0,
      damStatus: "open" as const,
      percentageFull: 0,
      tokensRemaining: damState.tokenLimit,
      lastMessageTokens: 0,
      lastConversationId: undefined,
      totalMessageCount: 0, // Reset message count
      lastUpdated: now,
      processingPaused: false,
      nextProcessingAllowed: undefined,
      accumulatedConversations: [], // Clear accumulated conversations
    };

    await ctx.db.patch(damState._id, drainedDamState);

    console.log(`[TokenDam] Dam drained for user ${args.userId} - processed ${tokensProcessed} tokens`);

    return {
      success: true,
      tokensProcessed,
      conversationsProcessed,
      damDrained: true,
      nextDamState: {
        currentTokens: 0,
        damStatus: "open" as const,
      },
    };
  },
});

/**
 * Trigger dam processing for a conversation
 * 
 * Manually trigger processing for a conversation, checking if it's allowed
 * based on current dam state and limits.
 */
/**
 * Migration helper: Fix existing dam records that don't have totalMessageCount
 */
export const migrateDamMessageCount = mutation({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    updated: v.boolean(),
    totalMessageCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const damState = await ctx.db
      .query("token_dam_state")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!damState) {
      return { success: true, updated: false, totalMessageCount: 0 };
    }

    // Check if totalMessageCount exists and is valid
    if (damState.totalMessageCount != null && damState.totalMessageCount >= 0) {
      return { success: true, updated: false, totalMessageCount: damState.totalMessageCount };
    }

    // Calculate totalMessageCount from accumulated conversations
    const calculatedMessageCount = damState.accumulatedConversations.reduce(
      (total, conv) => total + ((conv as any).messageCount || 0), 0
    );

    // Update the dam state with the calculated message count
    await ctx.db.patch(damState._id, {
      totalMessageCount: calculatedMessageCount,
    });

    console.log(`[TokenDam] Migrated message count for user ${args.userId}: ${calculatedMessageCount} messages`);

    return { 
      success: true, 
      updated: true, 
      totalMessageCount: calculatedMessageCount 
    };
  },
});

/**
 * Pause processing for a conversation
 * 
 * Manually pause processing for a conversation, typically due to
 * administrative action or policy enforcement.
 */
export const pauseDamProcessing = mutation({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
    reason: v.string(),
    pauseDurationMs: v.optional(v.number()), // How long to pause (default: 1 hour)
  },
  returns: v.object({
    success: v.boolean(),
    nextProcessingAllowed: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const pauseDuration = args.pauseDurationMs || (60 * 60 * 1000); // Default 1 hour
    const nextProcessingAllowed = now + pauseDuration;

    // Get or create dam state
    const damState = await ctx.db
      .query("token_dam_state")
      .withIndex("by_user", (q) => 
        q.eq("userId", args.userId)
      )
      .first();

    let damStateId: Id<"token_dam_state">;

    if (damState) {
      // Update existing state
      await ctx.db.patch(damState._id, {
        processingPaused: true,
        nextProcessingAllowed,
        lastUpdated: now,
      });
      damStateId = damState._id;
    } else {
      // Create new state with paused status
      const user = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .first();
      
      const tokenLimit = user?.subscription ? 
        (user.subscription.includedRequests || 100) * 1000 : 100000;

      damStateId = await ctx.db.insert("token_dam_state", {
        userId: args.userId,
        currentTokens: 0,
        tokenLimit,
        damStatus: "blocked",
        percentageFull: 0,
        tokensRemaining: tokenLimit,
        lastUpdated: now,
        createdAt: now,
        processingPaused: true,
        nextProcessingAllowed,
        accumulatedConversations: [],
        totalMessageCount: 0,
      });
    }

    // Record pause in history
    await ctx.db.insert("token_dam_processing_history", {
      userId: args.userId,
      damStateId,
      eventType: "processing_paused",
      tokensBefore: damState?.currentTokens || 0,
      tokensAfter: damState?.currentTokens || 0,
      tokensDelta: 0,
      processingAllowed: false,
      reasonBlocked: args.reason,
      timestamp: now,
      metadata: { pauseDurationMs: pauseDuration },
    });

    console.log(`[TokenDam] Paused processing for conversation ${args.conversationId}: ${args.reason}`);

    return {
      success: true,
      nextProcessingAllowed,
    };
  },
});

/**
 * Resume processing for a conversation
 * 
 * Manually resume processing that was previously paused.
 */
export const resumeDamProcessing = mutation({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    processingAllowed: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get dam state
    const damState = await ctx.db
      .query("token_dam_state")
      .withIndex("by_user", (q) => 
        q.eq("userId", args.userId)
      )
      .first();

    if (!damState) {
      throw new Error("Dam state not found");
    }

    // Check if we can resume based on token limits
    const processingAllowed = damState.damStatus !== "blocked" || damState.percentageFull < 100;

    // Update state
    await ctx.db.patch(damState._id, {
      processingPaused: false,
      nextProcessingAllowed: undefined,
      lastUpdated: now,
    });

    // Record resume in history
    await ctx.db.insert("token_dam_processing_history", {
      userId: args.userId,
      conversationId: args.conversationId,
      damStateId: damState._id,
      eventType: "processing_resumed",
      tokensBefore: damState.currentTokens,
      tokensAfter: damState.currentTokens,
      tokensDelta: 0,
      processingAllowed,
      reasonBlocked: processingAllowed ? undefined : "Token limit still exceeded",
      timestamp: now,
      metadata: { reason: args.reason || "Manual resume" },
    });

    console.log(`[TokenDam] Resumed processing for conversation ${args.conversationId}: ${args.reason || "Manual resume"}`);

    return {
      success: true,
      processingAllowed,
    };
  },
});

/**
 * Internal mutation to update usage statistics
 * 
 * This is called internally to maintain aggregate statistics for monitoring.
 */
export const updateUsageStatistics = internalMutation({
  args: {
    userId: v.string(),
    tokensUsed: v.number(),
    messagesProcessed: v.number(),
    conversationId: v.id("conversations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const todayStart = new Date(now).setHours(0, 0, 0, 0);
    const weekStart = new Date(now - 7 * 24 * 60 * 60 * 1000).getTime();
    const monthStart = new Date(now).setDate(1);

    const periods = [
      { type: "daily" as const, start: todayStart, end: todayStart + 24 * 60 * 60 * 1000 },
      { type: "weekly" as const, start: weekStart, end: now },
      { type: "monthly" as const, start: monthStart, end: monthStart + 31 * 24 * 60 * 60 * 1000 },
    ];

    // Get user's token limit
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    const tokenLimit = user?.subscription ? 
      (user.subscription.includedRequests || 100) * 1000 : 100000;

    for (const period of periods) {
      // Find existing stats for this period
      const existingStats = await ctx.db
        .query("token_usage_stats")
        .withIndex("by_user_period_start", (q) => 
          q.eq("userId", args.userId).eq("periodType", period.type).eq("periodStart", period.start)
        )
        .first();

      if (existingStats) {
        // Update existing stats
        const newTotalTokens = existingStats.totalTokensUsed + args.tokensUsed;
        const newTotalMessages = existingStats.totalMessages + args.messagesProcessed;
        const newPercentageUsed = (newTotalTokens / tokenLimit) * 100;

        await ctx.db.patch(existingStats._id, {
          totalTokensUsed: newTotalTokens,
          totalMessages: newTotalMessages,
          averageTokensPerMessage: newTotalMessages > 0 ? newTotalTokens / newTotalMessages : 0,
          peakTokensPerConversation: Math.max(existingStats.peakTokensPerConversation, args.tokensUsed),
          percentageUsed: newPercentageUsed,
          timesLimitExceeded: newPercentageUsed >= 100 ? existingStats.timesLimitExceeded + 1 : existingStats.timesLimitExceeded,
          lastUpdated: now,
        });
      } else {
        // Create new stats
        const percentageUsed = (args.tokensUsed / tokenLimit) * 100;
        
        await ctx.db.insert("token_usage_stats", {
          userId: args.userId,
          periodType: period.type,
          periodStart: period.start,
          periodEnd: period.end,
          totalTokensUsed: args.tokensUsed,
          totalMessages: args.messagesProcessed,
          conversationsActive: 1,
          averageTokensPerMessage: args.messagesProcessed > 0 ? args.tokensUsed / args.messagesProcessed : 0,
          peakTokensPerConversation: args.tokensUsed,
          tokenLimit,
          percentageUsed,
          timesLimitExceeded: percentageUsed >= 100 ? 1 : 0,
          timesPaused: 0,
          lastUpdated: now,
          createdAt: now,
        });
      }
    }

    return null;
  },
});
