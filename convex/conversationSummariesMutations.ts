import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new conversation summary
export const createConversationSummary = mutation({
  args: {
    userId: v.string(),
    projectId: v.optional(v.id("projects")),
    segmentId: v.string(),
    messageCount: v.number(),
    keyInsights: v.array(v.object({
      insight_type: v.string(),
      content: v.string(),
      confidence: v.number(),
      context: v.string(),
      importance: v.string(),
    })),
    workingStyleHints: v.array(v.string()),
    goalClarity: v.string(),
    collaborationPreferences: v.array(v.string()),
    timePreferences: v.array(v.string()),
    complexityIndicators: v.array(v.string()),
    emotionalTone: v.string(),
    nextQuestions: v.array(v.string()),
    summary: v.string(),
    agentVersion: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const summaryId = await ctx.db.insert("conversation_summaries", {
      userId: args.userId,
      projectId: args.projectId,
      segmentId: args.segmentId,
      messageCount: args.messageCount,
      keyInsights: args.keyInsights,
      workingStyleHints: args.workingStyleHints,
      goalClarity: args.goalClarity,
      collaborationPreferences: args.collaborationPreferences,
      timePreferences: args.timePreferences,
      complexityIndicators: args.complexityIndicators,
      emotionalTone: args.emotionalTone,
      nextQuestions: args.nextQuestions,
      summary: args.summary,
      createdAt: now,
      processedAt: now,
      agentVersion: args.agentVersion,
    });

    return summaryId;
  },
});

// Update conversation summary
export const updateConversationSummary = mutation({
  args: {
    summaryId: v.id("conversation_summaries"),
    updates: v.object({
      keyInsights: v.optional(v.array(v.object({
        insight_type: v.string(),
        content: v.string(),
        confidence: v.number(),
        context: v.string(),
        importance: v.string(),
      }))),
      workingStyleHints: v.optional(v.array(v.string())),
      goalClarity: v.optional(v.string()),
      collaborationPreferences: v.optional(v.array(v.string())),
      timePreferences: v.optional(v.array(v.string())),
      complexityIndicators: v.optional(v.array(v.string())),
      emotionalTone: v.optional(v.string()),
      nextQuestions: v.optional(v.array(v.string())),
      summary: v.optional(v.string()),
      processedAt: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const { summaryId, updates } = args;
    
    await ctx.db.patch(summaryId, {
      ...updates,
      processedAt: updates.processedAt || Date.now(),
    });

    return summaryId;
  },
});

// Delete conversation summary
export const deleteConversationSummary = mutation({
  args: {
    summaryId: v.id("conversation_summaries"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.summaryId);
    return { success: true };
  },
});

// Delete all conversation summaries for a project
export const deleteProjectConversationSummaries = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const summaries = await ctx.db
      .query("conversation_summaries")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const summary of summaries) {
      await ctx.db.delete(summary._id);
    }

    return { success: true, deletedCount: summaries.length };
  },
});
