import { v } from "convex/values";
import { query } from "./_generated/server";

// Get conversation summary by ID
export const getConversationSummary = query({
  args: {
    summaryId: v.id("conversation_summaries"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.summaryId);
  },
});

// Get conversation summaries for a user
export const getUserConversationSummaries = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("conversation_summaries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.limit) {
      query = query.take(args.limit);
    }

    return await query.collect();
  },
});

// Get conversation summaries for a project
export const getProjectConversationSummaries = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("conversation_summaries")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc");

    if (args.limit) {
      query = query.take(args.limit);
    }

    return await query.collect();
  },
});

// Get conversation summaries for a user and project
export const getUserProjectConversationSummaries = query({
  args: {
    userId: v.string(),
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("conversation_summaries")
      .withIndex("by_user_project", (q) => 
        q.eq("userId", args.userId).eq("projectId", args.projectId)
      )
      .order("desc");

    if (args.limit) {
      query = query.take(args.limit);
    }

    return await query.collect();
  },
});

// Get conversation summary by segment ID
export const getConversationSummaryBySegment = query({
  args: {
    segmentId: v.string(),
  },
  handler: async (ctx, args) => {
    const summary = await ctx.db
      .query("conversation_summaries")
      .withIndex("by_segment", (q) => q.eq("segmentId", args.segmentId))
      .first();

    return summary;
  },
});

// Get recent conversation summaries for a user
export const getRecentConversationSummaries = query({
  args: {
    userId: v.string(),
    hours: v.optional(v.number()), // Last N hours
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cutoffTime = args.hours 
      ? Date.now() - (args.hours * 60 * 60 * 1000)
      : 0;

    let query = ctx.db
      .query("conversation_summaries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("createdAt"), cutoffTime))
      .order("desc");

    if (args.limit) {
      query = query.take(args.limit);
    }

    return await query.collect();
  },
});

// Get conversation summaries with specific insight types
export const getConversationSummariesByInsightType = query({
  args: {
    userId: v.string(),
    insightType: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const summaries = await ctx.db
      .query("conversation_summaries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Filter summaries that contain the specified insight type
    const filteredSummaries = summaries.filter(summary => 
      summary.keyInsights.some(insight => insight.insight_type === args.insightType)
    );

    if (args.limit) {
      return filteredSummaries.slice(0, args.limit);
    }

    return filteredSummaries;
  },
});

// Get conversation summaries by goal clarity level
export const getConversationSummariesByGoalClarity = query({
  args: {
    userId: v.string(),
    goalClarity: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("conversation_summaries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("goalClarity"), args.goalClarity))
      .order("desc");

    if (args.limit) {
      query = query.take(args.limit);
    }

    return await query.collect();
  },
});

// Get conversation summaries by emotional tone
export const getConversationSummariesByEmotionalTone = query({
  args: {
    userId: v.string(),
    emotionalTone: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("conversation_summaries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("emotionalTone"), args.emotionalTone))
      .order("desc");

    if (args.limit) {
      query = query.take(args.limit);
    }

    return await query.collect();
  },
});
