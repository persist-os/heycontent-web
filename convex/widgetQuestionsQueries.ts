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

/**
 * Get all pending questions for a user across all projects (for homepage display)
 * Joins with projects and widgets to get display names
 */
export const getUserPendingQuestions = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all pending questions for user
    const questions = await ctx.db
      .query("widget_questions")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("status"), "pending")
        )
      )
      .order("desc")
      .take(10);  // Limit to 10 most recent
    
    // Enrich with project and widget names
    const enrichedQuestions = await Promise.all(
      questions.map(async (question) => {
        const project = await ctx.db.get(question.projectId);
        
        // Handle both string and Convex ID for widgetId
        let widget = null;
        if (typeof question.widgetId === "string") {
          // String ID - try to find by string match (legacy)
          widget = await ctx.db
            .query("widgets")
            .filter((q) => q.eq(q.field("_id"), question.widgetId))
            .first();
        } else {
          // Convex ID
          widget = await ctx.db.get(question.widgetId);
        }
        
        return {
          ...question,
          projectName: project?.name || "Unknown Project",
          familyName: widget?.familyIdentity?.familyName || widget?.title || "Widget",
        };
      })
    );
    
    return enrichedQuestions;
  },
});

