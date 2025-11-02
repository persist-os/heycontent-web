import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new widget question
 */
export const createQuestion = mutation({
  args: {
    widgetId: v.union(v.string(), v.id("widgets")),  // Supports both string and Convex ID
    projectId: v.id("projects"),
    userId: v.string(),
    question: v.string(),
    context: v.any(),
    suggestedAnswers: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const questionId = await ctx.db.insert("widget_questions", {
      widgetId: args.widgetId,
      projectId: args.projectId,
      userId: args.userId,
      question: args.question,
      context: args.context,
      suggestedAnswers: args.suggestedAnswers,
      status: "pending",
      createdAt: Date.now(),
    });
    
    return questionId;
  },
});

/**
 * Answer a widget question
 */
export const answerQuestion = mutation({
  args: {
    questionId: v.id("widget_questions"),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.questionId, {
      answer: args.answer,
      answeredAt: Date.now(),
      status: "answered",
    });
    
    return true;
  },
});

/**
 * Cancel a widget question
 */
export const cancelQuestion = mutation({
  args: {
    questionId: v.id("widget_questions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.questionId, {
      status: "cancelled",
    });
    
    return true;
  },
});

