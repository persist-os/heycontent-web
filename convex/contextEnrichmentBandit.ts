/**
 * Context Enrichment Bandit - MAB for learning optimal context strategies
 * 
 * Reuses MAB patterns from intelligenceBandit.ts but for context enrichment.
 */

import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Initialize MAB arms for a user + agent type
 */
export const initializeArms = mutation({
  args: {
    userId: v.string(),
    agentType: v.string(),
    arms: v.array(v.object({
      arm_id: v.string(),
      arm_name: v.string(),
      params: v.object({
        threshold: v.number(),
        limit: v.number(),
        content_types: v.array(v.string()),
        // Allow both nested and flat structures for backward compatibility
        shard_params: v.optional(v.object({
          limit: v.number(),
          dimensions: v.union(v.null(), v.array(v.string())),
          min_confidence: v.union(v.null(), v.string()),
          keywords: v.union(v.null(), v.array(v.string())),
          tags: v.union(v.null(), v.array(v.string())),
        })),
        // Flat structure (for Convergence-generated configs)
        shard_limit: v.optional(v.number()),
        shard_confidence: v.optional(v.number()),
      }),
      description: v.string(),
    })),
  },
  handler: async (ctx, { userId, agentType, arms }) => {
    // Check if already initialized
    const existing = await ctx.db
      .query("context_enrichment_arms")
      .withIndex("by_user_agent", (q) => q.eq("userId", userId).eq("agentType", agentType))
      .first();
    
    if (existing) {
      return { success: true, message: "Already initialized" };
    }
    
    // Create arms with optimistic priors (alpha=1, beta=1)
    for (const arm of arms) {
      await ctx.db.insert("context_enrichment_arms", {
        userId,
        agentType,
        armId: arm.arm_id,
        armName: arm.arm_name,
        strategy_params: arm.params,
        alpha: 1,  // Optimistic start
        beta: 1,
        total_pulls: 0,
        total_reward: 0,
        avg_reward: 0,
        mean_estimate: 0.5,
        confidence_interval: { lower: 0, upper: 1 },
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

/**
 * Delete all arms for a user + agent type (for reset purposes)
 */
export const deleteUserArms = mutation({
  args: { userId: v.string(), agentType: v.string() },
  handler: async (ctx, { userId, agentType }) => {
    const arms = await ctx.db
      .query("context_enrichment_arms")
      .withIndex("by_user_agent", (q) => q.eq("userId", userId).eq("agentType", agentType))
      .collect();
    
    for (const arm of arms) {
      await ctx.db.delete(arm._id);
    }
    
    return { success: true, deletedCount: arms.length };
  },
});

/**
 * Get user's MAB arms for a specific agent type
 */
export const getUserArms = query({
  args: { userId: v.string(), agentType: v.string() },
  handler: async (ctx, { userId, agentType }) => {
    const arms = await ctx.db
      .query("context_enrichment_arms")
      .withIndex("by_user_agent", (q) => q.eq("userId", userId).eq("agentType", agentType))
      .collect();
    
    return arms;
  },
});

/**
 * Create decision record
 */
export const createDecision = mutation({
  args: {
    userId: v.string(),
    agentType: v.string(),
    armPulled: v.string(),
    strategyUsed: v.object({
      threshold: v.number(),
      limit: v.number(),
      content_types: v.array(v.string()),
      // Allow both nested and flat structures for backward compatibility
      shard_params: v.optional(v.object({
        limit: v.number(),
        dimensions: v.union(v.null(), v.array(v.string())),
        min_confidence: v.union(v.null(), v.string()),
        keywords: v.union(v.null(), v.array(v.string())),
        tags: v.union(v.null(), v.array(v.string())),
      })),
      // Flat structure (for Convergence-generated configs)
      shard_limit: v.optional(v.number()),
      shard_confidence: v.optional(v.number()),
    }),
    arms_state: v.array(v.object({
      armId: v.string(),
      armName: v.string(),
      alpha: v.number(),
      beta: v.number(),
      sampled_value: v.number(),
    })),
    conversationId: v.optional(v.string()),
    messageIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const decisionId = await ctx.db.insert("context_enrichment_decisions", {
      userId: args.userId,
      agentType: args.agentType,
      conversationId: args.conversationId || "",
      messageIndex: args.messageIndex || 0,
      armPulled: args.armPulled,
      strategyUsed: args.strategyUsed,
      arms_state: args.arms_state,
      decisionAt: Date.now(),
    });
    
    return decisionId;
  },
});

/**
 * Update decision record with conversation context after message persistence
 */
export const updateDecisionContext = mutation({
  args: {
    decisionId: v.string(),
    conversationId: v.string(),
    messageIndex: v.number(),
  },
  handler: async (ctx, { decisionId, conversationId, messageIndex }) => {
    await ctx.db.patch(decisionId as any, {
      conversationId,
      messageIndex,
    });
    return { success: true };
  },
});

/**
 * Update arm performance with reward (Bayesian update)
 * 
 * NOTE: All Bayesian computation is now done by the SDK. This mutation only persists
 * pre-computed values received from the SDK, eliminating duplication across storage backends.
 */
export const updateArmPerformance = mutation({
  args: {
    userId: v.string(),
    agentType: v.string(),
    decisionId: v.string(),
    rating: v.optional(v.number()),  // 1-5 from user (optional - only if user rated)
    finalReward: v.optional(v.number()),  // 0.0-1.0 computed from rating (optional - only if rating provided)
    feedbackId: v.optional(v.id("feedback")),  // Feedback ID if feedback exists
    feedbackText: v.optional(v.string()),  // User's text feedback
    computedUpdate: v.optional(v.object({
      alpha: v.number(),
      beta: v.number(),
      total_pulls: v.number(),
      total_reward: v.number(),
      avg_reward: v.number(),
      mean_estimate: v.number(),
      confidence_interval: v.object({
        lower: v.number(),
        upper: v.number(),
      }),
    })),
  },
  handler: async (ctx, { userId, agentType, decisionId, rating, finalReward, feedbackId, feedbackText, computedUpdate }) => {
    // Get decision - decisionId should be a valid Convex ID
    const decision = await ctx.db.get(decisionId as any) as any;
    
    if (!decision) {
      throw new Error(`Decision not found: ${decisionId}`);
    }
    
    // Get arm
    const arm = await ctx.db
      .query("context_enrichment_arms")
      .withIndex("by_user_agent_arm", (q) =>
        q.eq("userId", userId).eq("agentType", agentType).eq("armId", decision.armPulled)
      )
      .first();
    
    if (!arm) {
      throw new Error(`Arm not found: ${decision.armPulled}`);
    }
    
    // Use pre-computed values from SDK (eliminates duplication)
    if (!computedUpdate) {
      throw new Error("computedUpdate is required - SDK should compute this");
    }
    
    // Persist pre-computed values from SDK
    const updateData = {
      alpha: computedUpdate.alpha,
      beta: computedUpdate.beta,
      total_pulls: computedUpdate.total_pulls,
      total_reward: computedUpdate.total_reward,
      avg_reward: computedUpdate.avg_reward,
      mean_estimate: computedUpdate.mean_estimate,
      confidence_interval: computedUpdate.confidence_interval,
      last_pulled: Date.now(),
      updatedAt: Date.now(),
    };
    
    await ctx.db.patch(arm._id, updateData);
    
    // Update decision with reward (only if rating provided)
    // Simplified: Only store rating and final_reward (no engagement_score, grading_score)
    if (rating !== undefined && finalReward !== undefined) {
      await ctx.db.patch(decision._id, {
        rating: rating,  // Store user rating (1-5)
        final_reward: finalReward,  // Store normalized reward (0.0-1.0)
        rewardObservedAt: Date.now(),
        feedbackId: feedbackId,  // Link to feedback record
        feedbackText: feedbackText,  // Store text feedback
      });
    }
    
    return { success: true };
  },
});

/**
 * Update decision with feedback data (direct linking - no Bayesian updates)
 * 
 * This is a lightweight mutation that only links feedback to decisions.
 * Bayesian updates are handled separately via updateArmPerformance.
 */
export const updateDecisionWithFeedback = mutation({
  args: {
    decisionId: v.string(),
    feedbackId: v.id("feedback"),
    rating: v.number(),  // 1-5
    finalReward: v.number(),  // 0.0-1.0 (normalized)
    feedbackText: v.optional(v.string()),
  },
  handler: async (ctx, { decisionId, feedbackId, rating, finalReward, feedbackText }) => {
    await ctx.db.patch(decisionId as any, {
      feedbackId: feedbackId,
      rating: rating,
      final_reward: finalReward,
      feedbackText: feedbackText,
      rewardObservedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Get MAB performance summary
 */
export const getBanditPerformance = query({
  args: { userId: v.string(), agentType: v.string() },
  handler: async (ctx, { userId, agentType }) => {
    const arms = await ctx.db
      .query("context_enrichment_arms")
      .withIndex("by_user_agent", (q) => q.eq("userId", userId).eq("agentType", agentType))
      .collect();
    
    const sorted = arms
      .sort((a, b) => b.avg_reward - a.avg_reward)
      .map((arm) => ({
        name: arm.armName,
        avgReward: arm.avg_reward,
        pulls: arm.total_pulls,
        confidence: arm.mean_estimate,
        confidenceInterval: arm.confidence_interval,
        strategyParams: arm.strategy_params,
      }));
    
    const totalDecisions = arms.reduce((sum, a) => sum + a.total_pulls, 0);
    const convergence = sorted[0]?.pulls / Math.max(1, totalDecisions) || 0;
    
    return {
      arms: sorted,
      bestArm: sorted[0],
      convergence,
      totalDecisions,
    };
  },
});

/**
 * Get decision by ID
 */
export const getDecisionById = query({
  args: {
    decisionId: v.string(),
  },
  handler: async (ctx, { decisionId }) => {
    const decision = await ctx.db.get(decisionId as any);
    return decision;
  },
});
