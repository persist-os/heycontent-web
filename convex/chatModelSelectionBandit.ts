/**
 * Chat Model Selection Bandit - MAB for adaptive model selection
 * 
 * Uses Convergence SDK for all MAB logic. Convex only persists pre-computed values.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Initialize MAB arms for a user + agent type
 */
export const initializeArms = mutation({
  args: {
    userId: v.string(),
    agentType: v.string(),
    arms: v.array(v.object({
      armId: v.string(),
      armName: v.optional(v.string()),
      params: v.any(),  // Flexible params structure
      description: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { userId, agentType, arms }) => {
    // Check if already initialized
    const existing = await ctx.db
      .query("chat_model_selection_arms")
      .withIndex("by_user_agent", (q) => q.eq("userId", userId).eq("agentType", agentType))
      .first();
    
    if (existing) {
      return { success: true, message: "Already initialized" };
    }
    
    // Create arms with optimistic priors (alpha=1, beta=1)
    // isEvolved: false indicates these are initialized from defaults, not evolved
    for (const arm of arms) {
      await ctx.db.insert("chat_model_selection_arms", {
        userId,
        agentType,
        armId: arm.armId,
        armName: arm.armName || arm.armId,
        params: arm.params,
        alpha: 1,  // Optimistic start
        beta: 1,
        total_pulls: 0,
        total_reward: 0,
        avg_reward: 0,
        mean_estimate: 0.5,
        confidence_interval: { lower: 0, upper: 1 },
        isEvolved: false,  // Mark as initialized from defaults (not evolved)
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

/**
 * Get user's MAB arms for a specific agent type
 */
export const getUserArms = query({
  args: {
    userId: v.string(),
    agentType: v.string(),
  },
  handler: async (ctx, { userId, agentType }) => {
    const arms = await ctx.db
      .query("chat_model_selection_arms")
      .withIndex("by_user_agent", (q) => q.eq("userId", userId).eq("agentType", agentType))
      .collect();
    
    return {
      success: true,
      arms: arms.map((arm: any) => ({
        arm_id: arm.armId,
        name: arm.armName,
        params: arm.params,
        alpha: arm.alpha,
        beta: arm.beta,
        total_pulls: arm.total_pulls,
        total_reward: arm.total_reward,
        avg_reward: arm.avg_reward,
        mean_estimate: arm.mean_estimate,
        confidence_interval: arm.confidence_interval,
      })),
    };
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
    strategyUsed: v.any(),  // Arm params
    armsState: v.array(v.object({
      armId: v.string(),
      armName: v.string(),
      alpha: v.number(),
      beta: v.number(),
      sampled_value: v.number(),
    })),
    conversationId: v.string(),  // Required for decision tracking
    messageIndex: v.number(),    // Required for decision tracking (matches message.sequence)
  },
  handler: async (ctx, { userId, agentType, armPulled, strategyUsed, armsState, conversationId, messageIndex }) => {
    const decisionId = await ctx.db.insert("chat_model_selection_decisions", {
      userId,
      agentType,
      armPulled,
      strategyUsed,
      armsState,
      conversationId,  // Always include (required)
      messageIndex,    // Always include (required)
      final_reward: null,
      createdAt: Date.now(),
      rewardObservedAt: null,
    });
    
    return { success: true, decisionId };
  },
});

/**
 * Update arm performance with reward (Bayesian update)
 * 
 * NOTE: All Bayesian computation is done by the SDK. This mutation only persists
 * pre-computed values received from the SDK.
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
    computedUpdate: v.object({
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
    }),
  },
  handler: async (ctx, { userId, agentType, decisionId, rating, finalReward, feedbackId, feedbackText, computedUpdate }) => {
    // Get decision
    const decision = await ctx.db.get(decisionId as any) as any;
    
    if (!decision) {
      throw new Error(`Decision not found: ${decisionId}`);
    }
    
    // Get arm
    const arm = await ctx.db
      .query("chat_model_selection_arms")
      .withIndex("by_user_agent_arm", (q) =>
        q.eq("userId", userId).eq("agentType", agentType).eq("armId", decision.armPulled)
      )
      .first();
    
    if (!arm) {
      throw new Error(`Arm not found: ${decision.armPulled}`);
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
    // Simplified: Only store rating and final_reward (no engagement_score, grading_score, latency_score, cost_efficiency)
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
 * Get decision by ID
 */
export const getDecision = query({
  args: { userId: v.string(), decisionId: v.string() },
  handler: async (ctx, { userId, decisionId }) => {
    const decision = await ctx.db.get(decisionId as any) as any;
    
    if (!decision || decision.userId !== userId) {
      return { success: false, error: "Decision not found" };
    }
    
    // Transform armsState from camelCase (armId) to snake_case (arm_id) for SDK
    const transformedArmsSnapshot = (decision.armsState || []).map((arm: any) => ({
      arm_id: arm.armId,  // Transform armId → arm_id
      arm_name: arm.armName,
      alpha: arm.alpha,
      beta: arm.beta,
      sampled_value: arm.sampled_value,
    }));
    
    return {
      success: true,
      decision: {
        decision_id: decision._id,
        user_id: decision.userId,
        agent_type: decision.agentType,
        arm_id: decision.armPulled,
        params: decision.strategyUsed,
        arms_snapshot: transformedArmsSnapshot,  // Use transformed snapshot
        created_at: decision.createdAt,
        metadata: {
          conversation_id: decision.conversationId,
          message_index: decision.messageIndex,
        },
      },
    };
  },
});

/**
 * Count feedback records for user/agent pair.
 * 
 * Counts decisions with feedback (has rating or updated reward).
 */
export const countFeedbacks = query({
  args: {
    userId: v.string(),
    agentType: v.string(),
  },
  handler: async (ctx, args) => {
    // Count decisions with feedback (has rating or updated reward)
    const decisions = await ctx.db
      .query("chat_model_selection_decisions")
      .withIndex("by_user_agent", (q) => 
        q.eq("userId", args.userId).eq("agentType", args.agentType)
      )
      .filter((q) => q.or(
        q.neq(q.field("final_reward"), null),
        q.neq(q.field("rating"), null),
        q.neq(q.field("rewardObservedAt"), null)
      ))
      .collect();
    
    return { count: decisions.length };
  },
});

