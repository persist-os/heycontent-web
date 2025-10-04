/**
 * Intelligence Bandit - Multi-Armed Bandit for adaptive intelligence trigger learning
 * 
 * This implements Thompson Sampling (Bayesian approach) to learn the optimal
 * trigger strategy for each user. Each arm represents a different strategy
 * for deciding when to run intelligence analysis.
 * 
 * Best Practices:
 * - Beta distribution for binary rewards (good/bad analysis)
 * - Optimistic initialization (alpha=1, beta=1) for exploration
 * - Bayesian updates with weighted rewards
 * - 95% confidence intervals for convergence tracking
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { banditArmValidator, userStateValidator } from "./types/intelligenceBandit";

/**
 * Initialize MAB arms for a new user.
 * Called once when user first uses the system.
 * 
 * Uses optimistic initialization (alpha=1, beta=1) to encourage exploration.
 */
export const initializeArms = mutation({
  args: {
    userId: v.string(),
    arms: v.array(v.object({
      arm_id: v.string(),
      arm_name: v.string(),
      description: v.string(),
    })),
  },
  handler: async (ctx, { userId, arms }) => {
    // Check if already initialized
    const existing = await ctx.db
      .query("intelligence_bandit_arms")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existing) {
      return { 
        success: true, 
        message: "Arms already initialized",
        data: { alreadyInitialized: true }
      };
    }
    
    // Create arms with optimistic priors (encourages exploration)
    const now = Date.now();
    for (const arm of arms) {
      await ctx.db.insert("intelligence_bandit_arms", {
        userId,
        armId: arm.arm_id,
        armName: arm.arm_name,
        alpha: 1.0,  // Optimistic prior
        beta: 1.0,   // Optimistic prior
        total_pulls: 0,
        total_reward: 0,
        avg_reward: 0,
        mean_estimate: 0.5,
        confidence_interval: { lower: 0, upper: 1 },
        updatedAt: now,
      });
    }
    
    return { 
      success: true, 
      message: `Initialized ${arms.length} MAB arms`,
      data: { armsCreated: arms.length }
    };
  },
});

/**
 * Get user's MAB arms with current state.
 * Used by Python backend for Thompson Sampling.
 */
export const getUserArms = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const arms = await ctx.db
      .query("intelligence_bandit_arms")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    return arms;
  },
});

/**
 * Create decision record.
 * Called every time MAB makes a decision (triggered or not).
 * Links to background job if analysis was triggered.
 */
export const createDecision = mutation({
  args: {
    userId: v.string(),
    armPulled: v.string(),
    triggered: v.boolean(),
    state_snapshot: userStateValidator,
    arms_state: v.array(banditArmValidator),
    jobId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const decisionId = await ctx.db.insert("intelligence_bandit_decisions", {
      userId: args.userId,
      jobId: args.jobId,
      armPulled: args.armPulled,
      triggered: args.triggered,
      state_snapshot: args.state_snapshot,
      arms_state: args.arms_state,
      decisionAt: Date.now(),
    });
    
    return decisionId;
  },
});

/**
 * Update arm performance with reward after analysis completes.
 * 
 * Implements Bayesian update for Beta distribution:
 * - alpha += reward (success weight)
 * - beta += (1 - reward) (failure weight)
 * 
 * Value score (reward) is 0-1 where:
 * - 1.0 = highly valuable analysis (many insights)
 * - 0.0 = wasted analysis (no insights)
 */
export const updateArmPerformance = mutation({
  args: {
    userId: v.string(),
    decisionId: v.id("intelligence_bandit_decisions"),
    valueScore: v.number(),
    version: v.optional(v.number()), // For optimistic locking
  },
  handler: async (ctx, { userId, decisionId, valueScore, version }) => {
    // Get decision
    const decision = await ctx.db.get(decisionId);

    if (!decision) {
      throw new Error(`Decision not found: ${decisionId}`);
    }

    if (decision.userId !== userId) {
      throw new Error(`Decision userId mismatch: ${decision.userId} vs ${userId}`);
    }

    // Get arm with optimistic locking
    const armQuery = ctx.db
      .query("intelligence_bandit_arms")
      .withIndex("by_user_arm", (q) =>
        q.eq("userId", userId).eq("armId", decision.armPulled)
      );

    // If version provided, add optimistic locking check
    if (version !== undefined) {
      // This is a simplified approach - in production, you'd need to modify schema
      // to include version field or use a more sophisticated locking mechanism
    }

    const arm = await armQuery.first();

    if (!arm) {
      throw new Error(`Arm not found: ${decision.armPulled}`);
    }

    // Check version for optimistic locking (if provided)
    if (version !== undefined && arm.updatedAt !== version) {
      throw new Error(`Arm version mismatch: concurrent update detected`);
    }

    // Bayesian update (Beta distribution)
    const successWeight = valueScore;
    const failureWeight = 1 - valueScore;

    const newAlpha = arm.alpha + successWeight;
    const newBeta = arm.beta + failureWeight;
    const newTotalPulls = arm.total_pulls + 1;
    const newTotalReward = arm.total_reward + valueScore;
    const newAvgReward = newTotalReward / newTotalPulls;
    const newMeanEstimate = newAlpha / (newAlpha + newBeta);

    // Calculate 95% confidence interval
    // For Beta(alpha, beta), variance = (alpha * beta) / ((alpha+beta)^2 * (alpha+beta+1))
    const variance = (newAlpha * newBeta) /
      (Math.pow(newAlpha + newBeta, 2) * (newAlpha + newBeta + 1));
    const stdDev = Math.sqrt(variance);

    const newUpdatedAt = Date.now();

    // Update arm atomically using patch
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
      last_pulled: newUpdatedAt,
      updatedAt: newUpdatedAt,
    });

    // Update decision with reward
    await ctx.db.patch(decision._id, {
      reward: valueScore,
      rewardObservedAt: newUpdatedAt,
    });

    return {
      success: true,
      data: {
        armId: arm.armId,
        newAlpha,
        newBeta,
        newMeanEstimate,
        newAvgReward,
        version: newUpdatedAt // Return new version for next update
      }
    };
  },
});

/**
 * Get MAB performance summary for monitoring/debugging.
 * Shows which strategies are winning.
 */
export const getBanditPerformance = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const arms = await ctx.db
      .query("intelligence_bandit_arms")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    if (arms.length === 0) {
      return {
        arms: [],
        bestArm: null,
        convergence: 0,
        totalDecisions: 0,
      };
    }
    
    // Sort by average reward (descending)
    const sorted = arms
      .sort((a, b) => b.avg_reward - a.avg_reward)
      .map((arm) => ({
        name: arm.armName,
        avgReward: arm.avg_reward,
        pulls: arm.total_pulls,
        confidence: arm.mean_estimate,
        confidenceInterval: arm.confidence_interval,
        alpha: arm.alpha,
        beta: arm.beta,
      }));
    
    const totalDecisions = arms.reduce((sum, a) => sum + a.total_pulls, 0);
    
    // Convergence = how often we pick the best arm (0-1)
    const convergence = totalDecisions > 0 
      ? sorted[0]?.pulls / totalDecisions 
      : 0;
    
    return {
      arms: sorted,
      bestArm: sorted[0] || null,
      convergence,
      totalDecisions,
    };
  },
});

/**
 * Get recent decisions for debugging/analysis.
 */
export const getRecentDecisions = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 20 }) => {
    const decisions = await ctx.db
      .query("intelligence_bandit_decisions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
    
    return decisions;
  },
});

/**
 * Get decision history for a specific arm.
 */
export const getArmDecisionHistory = query({
  args: {
    userId: v.string(),
    armId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, armId, limit = 50 }) => {
    const decisions = await ctx.db
      .query("intelligence_bandit_decisions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("armPulled"), armId))
      .order("desc")
      .take(limit);
    
    return decisions;
  },
});

