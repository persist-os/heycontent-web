import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Execution Plan Queries
 * Real-time queries for plan progress tracking
 */

/**
 * Get plan progress by plan ID
 * Frontend can subscribe to this for real-time updates
 */
export const getPlanProgress = query({
  args: {
    planId: v.string(),
    userId: v.string(),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, { planId, userId }) => {
    // Find plan by planId field
    const plan = await ctx.db
      .query("execution_plans")
      .filter((q) => q.eq(q.field("planId"), planId))
      .first();

    if (!plan || plan.userId !== userId) {
      return null;
    }

    return {
      planId: plan.planId,
      projectId: plan.projectId,
      status: plan.status,
      steps: plan.steps,
      totalSteps: plan.steps?.length || 0,
      result: plan.result,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  },
});

/**
 * Get latest plan for project
 */
export const getLatestPlanForProject = query({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, { projectId, userId }) => {
    const plan = await ctx.db
      .query("execution_plans")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .first();

    if (!plan) {
      return null;
    }

    return {
      planId: plan.planId,
      projectId: plan.projectId,
      status: plan.status,
      steps: plan.steps,
      totalSteps: plan.steps?.length || 0,
      result: plan.result,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  },
});

