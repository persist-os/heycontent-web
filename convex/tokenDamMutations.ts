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
 * Update or create token dam state for a conversation
 * 
 * This is the primary mutation for updating dam state when tokens are consumed.
 * It calculates current usage, determines dam status, and enforces limits.
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
      
      // Calculate token limit based on subscription (example: 1000 tokens per included request)
      tokenLimit = (user.subscription.includedRequests || 100) * 1000;
    }

    // Find existing dam state for this conversation
    const existingDamState = await ctx.db
      .query("token_dam_state")
      .withIndex("by_user_conversation", (q) => 
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .first();

    const previousTokens = existingDamState?.currentTokens || 0;
    const newCurrentTokens = Math.max(0, previousTokens + args.tokensUsed);
    const percentageFull = Math.min(100, (newCurrentTokens / tokenLimit) * 100);
    const tokensRemaining = Math.max(0, tokenLimit - newCurrentTokens);

    // Determine dam status based on percentage
    let damStatus: "open" | "approaching" | "full" | "blocked";
    if (percentageFull >= 100) {
      damStatus = "blocked";
    } else if (percentageFull >= 95) {
      damStatus = "full";
    } else if (percentageFull >= 80) {
      damStatus = "approaching";
    } else {
      damStatus = "open";
    }

    const processingPaused = damStatus === "blocked";
    const nextProcessingAllowed = processingPaused ? now + (60 * 60 * 1000) : undefined; // 1 hour cooldown

    const damStateData = {
      userId: args.userId,
      conversationId: args.conversationId,
      currentTokens: newCurrentTokens,
      tokenLimit,
      damStatus,
      percentageFull,
      tokensRemaining,
      lastMessageTokens: args.tokensUsed,
      lastUpdated: now,
      processingPaused,
      nextProcessingAllowed,
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

    console.log(`[TokenDam] Updated state for conversation ${args.conversationId}: ${damStatus} (${percentageFull.toFixed(1)}% full)`);

    return {
      damStatus,
      currentTokens: newCurrentTokens,
      tokenLimit,
      percentageFull,
      tokensRemaining,
      processingPaused,
    };
  },
});

/**
 * Trigger dam processing for a conversation
 * 
 * Manually trigger processing for a conversation, checking if it's allowed
 * based on current dam state and limits.
 */
export const triggerDamProcessing = mutation({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
    requestId: v.optional(v.string()),
    overrideLimits: v.optional(v.boolean()), // Admin override for limits
  },
  returns: v.object({
    processingAllowed: v.boolean(),
    damStatus: v.union(
      v.literal("open"),
      v.literal("approaching"), 
      v.literal("full"),
      v.literal("blocked")
    ),
    reasonBlocked: v.optional(v.string()),
    nextProcessingAllowed: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get current dam state
    const damState = await ctx.db
      .query("token_dam_state")
      .withIndex("by_user_conversation", (q) => 
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .first();

    if (!damState) {
      // No dam state exists, processing is allowed
      return {
        processingAllowed: true,
        damStatus: "open" as const,
      };
    }

    // Check if processing is currently paused
    let processingAllowed = !damState.processingPaused;
    let reasonBlocked: string | undefined;

    // Check if enough time has passed since last block
    if (damState.nextProcessingAllowed && now < damState.nextProcessingAllowed) {
      processingAllowed = false;
      reasonBlocked = `Processing paused until ${new Date(damState.nextProcessingAllowed).toISOString()}`;
    }

    // Admin override
    if (args.overrideLimits) {
      processingAllowed = true;
      reasonBlocked = undefined;
    }

    // If processing was resumed, update the dam state
    if (processingAllowed && damState.processingPaused) {
      await ctx.db.patch(damState._id, {
        processingPaused: false,
        nextProcessingAllowed: undefined,
        lastUpdated: now,
      });

      // Record history
      await ctx.db.insert("token_dam_processing_history", {
        userId: args.userId,
        conversationId: args.conversationId,
        damStateId: damState._id,
        eventType: "processing_resumed",
        tokensBefore: damState.currentTokens,
        tokensAfter: damState.currentTokens,
        tokensDelta: 0,
        processingAllowed: true,
        timestamp: now,
        requestId: args.requestId,
      });

      console.log(`[TokenDam] Processing resumed for conversation ${args.conversationId}`);
    }

    // Record manual trigger attempt
    await ctx.db.insert("token_dam_processing_history", {
      userId: args.userId,
      conversationId: args.conversationId,
      damStateId: damState._id,
      eventType: "manual_trigger",
      tokensBefore: damState.currentTokens,
      tokensAfter: damState.currentTokens,
      tokensDelta: 0,
      processingAllowed,
      reasonBlocked,
      timestamp: now,
      requestId: args.requestId,
    });

    return {
      processingAllowed,
      damStatus: damState.damStatus,
      reasonBlocked,
      nextProcessingAllowed: damState.nextProcessingAllowed,
    };
  },
});

/**
 * Reset dam state for a conversation
 * 
 * Resets token counting for a conversation, useful for new billing periods
 * or when subscription limits change.
 */
export const resetDamState = mutation({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
    newTokenLimit: v.optional(v.number()),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    newState: v.object({
      currentTokens: v.number(),
      tokenLimit: v.number(),
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
    
    // Get user's token limit if not provided
    let tokenLimit = args.newTokenLimit;
    if (!tokenLimit) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .first();
      
      if (!user?.subscription) {
        throw new Error("User subscription not found");
      }
      
      tokenLimit = (user.subscription.includedRequests || 100) * 1000;
    }

    // Find existing dam state
    const existingDamState = await ctx.db
      .query("token_dam_state")
      .withIndex("by_user_conversation", (q) => 
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .first();

    const resetData = {
      userId: args.userId,
      conversationId: args.conversationId,
      currentTokens: 0,
      tokenLimit,
      damStatus: "open" as const,
      percentageFull: 0,
      tokensRemaining: tokenLimit,
      lastMessageTokens: undefined,
      lastUpdated: now,
      processingPaused: false,
      nextProcessingAllowed: undefined,
    };

    let damStateId: Id<"token_dam_state">;

    if (existingDamState) {
      await ctx.db.patch(existingDamState._id, resetData);
      damStateId = existingDamState._id;
    } else {
      damStateId = await ctx.db.insert("token_dam_state", {
        ...resetData,
        createdAt: now,
      });
    }

    // Record reset in history
    await ctx.db.insert("token_dam_processing_history", {
      userId: args.userId,
      conversationId: args.conversationId,
      damStateId,
      eventType: "dam_updated",
      tokensBefore: existingDamState?.currentTokens || 0,
      tokensAfter: 0,
      tokensDelta: -(existingDamState?.currentTokens || 0),
      processingAllowed: true,
      reasonBlocked: undefined,
      timestamp: now,
      metadata: { reason: args.reason || "Manual reset" },
    });

    console.log(`[TokenDam] Reset state for conversation ${args.conversationId}: ${args.reason || "Manual reset"}`);

    return {
      success: true,
      newState: {
        currentTokens: 0,
        tokenLimit,
        damStatus: "open" as const,
      },
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
    let damState = await ctx.db
      .query("token_dam_state")
      .withIndex("by_user_conversation", (q) => 
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
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
        conversationId: args.conversationId,
        currentTokens: 0,
        tokenLimit,
        damStatus: "blocked",
        percentageFull: 0,
        tokensRemaining: tokenLimit,
        lastUpdated: now,
        createdAt: now,
        processingPaused: true,
        nextProcessingAllowed,
      });
    }

    // Record pause in history
    await ctx.db.insert("token_dam_processing_history", {
      userId: args.userId,
      conversationId: args.conversationId,
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
      .withIndex("by_user_conversation", (q) => 
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
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
