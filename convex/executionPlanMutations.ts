import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { executionPlanCreateValidator } from "./types/executionPlan";

/**
 * Execution Plan Mutations
 * Minimal CRUD operations for project execution plans
 */

/**
 * Save execution plan
 */
export const savePlan = mutation({
  args: executionPlanCreateValidator,
  returns: v.id("execution_plans"),
  handler: async (ctx, args) => {
    const now = Date.now();

    const planId = await ctx.db.insert("execution_plans", {
      planId: args.planId,
      userId: args.userId,
      projectId: args.projectId,
      steps: args.steps,
      totalEstimatedDurationMinutes: args.totalEstimatedDurationMinutes,
      cognitiveContext: args.cognitiveContext,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return planId;
  },
});

/**
 * Get latest plan for project
 */
export const getLatestPlan = mutation({
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

    return plan;
  },
});

