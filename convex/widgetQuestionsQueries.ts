import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get pending questions for an assignment
 */
export const getPendingQuestions = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("widget_questions")
      .withIndex("by_project_status", (q) =>
        q.eq("projectId", args.projectId).eq("status", "pending")
      )
      .collect();
  },
});

/**
 * Get all questions for an assignment
 */
export const getAssignmentQuestions = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("widget_questions")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

/**
 * Get question by ID
 */
export const getQuestionById = query({
  args: {
    questionId: v.id("widget_questions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.questionId);
  },
});

/**
 * Get questions for a specific widget
 */
export const getWidgetQuestions = query({
  args: {
    widgetId: v.union(v.string(), v.id("widgets")),  // Supports both string and Convex ID
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("widget_questions")
      .withIndex("by_widget", (q) => q.eq("widgetId", args.widgetId))
      .collect();
  },
});

