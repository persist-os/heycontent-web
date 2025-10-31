import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { executionPlanCreateValidator } from "./types/executionPlan";

/**
 * Execution Plan Mutations
 * Minimal CRUD operations for project execution plans
 */

/**
 * Save execution plan
 * Returns Convex document ID (_id) which becomes the plan_id
 */
export const savePlan = mutation({
  args: executionPlanCreateValidator,
  returns: v.id("execution_plans"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Generate planId based on project and timestamp
    const planId = `plan_${args.projectId}_${now}`;

    // Insert with auto-generated fields
    const convexId = await ctx.db.insert("execution_plans", {
      ...args,
      planId, // Business identifier
      status: "pending", // Convex generates
      createdAt: now, // Convex generates
      updatedAt: now, // Convex generates
    });

    return convexId; // Return Convex _id
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

/**
 * Update plan status
 */
export const updatePlanStatus = mutation({
  args: {
    planId: v.string(),
    status: v.string(), // "pending", "executing", "completed", "failed"
    result: v.optional(v.any()),
  },
  returns: v.boolean(),
  handler: async (ctx, { planId, status, result }) => {
    // Find plan by planId field
    const plan = await ctx.db
      .query("execution_plans")
      .filter((q) => q.eq(q.field("planId"), planId))
      .first();

    if (!plan) {
      return false;
    }

    await ctx.db.patch(plan._id, {
      status,
      updatedAt: Date.now(),
      ...(result && { result }),
    });

    return true;
  },
});

