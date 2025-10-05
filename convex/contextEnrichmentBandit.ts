/**
 * Context Enrichment Bandit - MAB for learning optimal context strategies
 * 
 * Reuses MAB patterns from intelligenceBandit.ts but for context enrichment.
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
      arm_id: v.string(),
      arm_name: v.string(),
      params: v.object({
        threshold: v.number(),
        limit: v.number(),
        content_types: v.array(v.string()),
        shard_params: v.optional(v.object({
          limit: v.number(),
          dimensions: v.union(v.null(), v.array(v.string())),
          min_confidence: v.union(v.null(), v.string()),
        })),
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
      shard_params: v.optional(v.object({
        limit: v.number(),
        dimensions: v.union(v.null(), v.array(v.string())),
        min_confidence: v.union(v.null(), v.string()),
      })),
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
 */
export const updateArmPerformance = mutation({
  args: {
    userId: v.string(),
    agentType: v.string(),
    decisionId: v.string(),
    engagementScore: v.number(),
    gradingScore: v.optional(v.number()),
    finalReward: v.number(),
  },
  handler: async (ctx, { userId, agentType, decisionId, engagementScore, gradingScore, finalReward }) => {
    // Get decision
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
    
    // Bayesian update (Beta distribution)
    const successWeight = finalReward;
    const failureWeight = 1 - finalReward;
    
    const newAlpha = arm.alpha + successWeight;
    const newBeta = arm.beta + failureWeight;
    const newTotalPulls = arm.total_pulls + 1;
    const newTotalReward = arm.total_reward + finalReward;
    const newAvgReward = newTotalReward / newTotalPulls;
    const newMeanEstimate = newAlpha / (newAlpha + newBeta);
    
    // Update confidence interval (95% CI)
    const variance = (newAlpha * newBeta) /
      ((newAlpha + newBeta) ** 2 * (newAlpha + newBeta + 1));
    const stdDev = Math.sqrt(variance);
    
    await ctx.db.patch(arm._id, {
      alpha: newAlpha,
      beta: newBeta,
      total_pulls: newTotalPulls,
      total_reward: newTotalReward,
      avg_reward: newAvgReward,
      mean_estimate: newMeanEstimate,
      confidence_interval: {
        lower: Math.max(0, newMeanEstimate - 1.96 * stdDev),
        upper: Math.min(1, newMeanEstimate + 1.96 * stdDev),
      },
      last_pulled: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Update decision with reward
    await ctx.db.patch(decision._id, {
      engagement_score: engagementScore,
      grading_score: gradingScore,
      final_reward: finalReward,
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

