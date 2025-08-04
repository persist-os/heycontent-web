import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Create new feedback entry
export const createFeedback = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    description: v.string(),
    userEmail: v.string(),
    userName: v.string(),
    page: v.string(),
    userAgent: v.string(),
    timestamp: v.number(),
    userId: v.optional(v.string()),
    priority: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    screenshots: v.array(v.object({
      name: v.string(),
      size: v.number(),
      type: v.string(),
      url: v.optional(v.string())
    })),
    discordMessageId: v.optional(v.string()),
  },
  returns: v.id("feedback"),
  handler: async (ctx, args) => {
    const feedbackId = await ctx.db.insert("feedback", {
      type: args.type,
      title: args.title,
      description: args.description,
      userEmail: args.userEmail,
      userName: args.userName,
      page: args.page,
      userAgent: args.userAgent,
      timestamp: args.timestamp,
      userId: args.userId,
      status: "new",
      priority: args.priority || "medium",
      assignedTo: args.assignedTo,
      tags: [],
      screenshots: args.screenshots,
      discordMessageId: args.discordMessageId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return feedbackId;
  },
});

// Get all feedback with pagination and filtering
export const listFeedback = query({
  args: {
    status: v.optional(v.string()),
    type: v.optional(v.string()),
    priority: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    feedback: v.array(v.object({
      _id: v.id("feedback"),
      _creationTime: v.number(),
      type: v.string(),
      title: v.string(),
      description: v.string(),
      userEmail: v.string(),
      userName: v.string(),
      page: v.string(),
      userAgent: v.string(),
      timestamp: v.number(),
      userId: v.optional(v.string()),
      status: v.string(),
      priority: v.string(),
      assignedTo: v.optional(v.string()),
      tags: v.array(v.string()),
      screenshots: v.array(v.object({
        name: v.string(),
        size: v.number(),
        type: v.string(),
        url: v.optional(v.string())
      })),
      discordMessageId: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })),
    isDone: v.boolean(),
    continueCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Use the by_created index to get all feedback ordered by creation time
    const feedbackQuery = ctx.db.query("feedback").withIndex("by_created", (q) => q);

    // Order by creation time (newest first)
    const orderedQuery = feedbackQuery.order("desc");

    // Apply pagination
    const limit = args.limit || 20;
    const result = await orderedQuery.paginate({
      numItems: limit,
      cursor: args.cursor,
    });

    return {
      feedback: result.page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

// Get single feedback by ID
export const getFeedback = query({
  args: {
    feedbackId: v.id("feedback"),
  },
  returns: v.union(
    v.object({
      _id: v.id("feedback"),
      _creationTime: v.number(),
      type: v.string(),
      title: v.string(),
      description: v.string(),
      userEmail: v.string(),
      userName: v.string(),
      page: v.string(),
      userAgent: v.string(),
      timestamp: v.number(),
      userId: v.optional(v.string()),
      status: v.string(),
      priority: v.string(),
      assignedTo: v.optional(v.string()),
      tags: v.array(v.string()),
      screenshots: v.array(v.object({
        name: v.string(),
        size: v.number(),
        type: v.string(),
        url: v.optional(v.string())
      })),
      discordMessageId: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    return feedback;
  },
});

// Update feedback status
export const updateFeedbackStatus = mutation({
  args: {
    feedbackId: v.id("feedback"),
    status: v.string(),
    priority: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updateData: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.priority) {
      updateData.priority = args.priority;
    }
    if (args.assignedTo !== undefined) {
      updateData.assignedTo = args.assignedTo;
    }
    if (args.tags) {
      updateData.tags = args.tags;
    }

    await ctx.db.patch(args.feedbackId, updateData);
    return null;
  },
});

// Get feedback statistics
export const getFeedbackStats = query({
  args: {},
  returns: v.object({
    total: v.number(),
    byStatus: v.record(v.string(), v.number()),
    byType: v.record(v.string(), v.number()),
    byPriority: v.record(v.string(), v.number()),
    recentActivity: v.array(v.object({
      _id: v.id("feedback"),
      _creationTime: v.number(),
      type: v.string(),
      title: v.string(),
      status: v.string(),
      priority: v.string(),
      userName: v.string(),
      createdAt: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    const allFeedback = await ctx.db.query("feedback").collect();

    // Calculate statistics
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    allFeedback.forEach((feedback) => {
      byStatus[feedback.status] = (byStatus[feedback.status] || 0) + 1;
      byType[feedback.type] = (byType[feedback.type] || 0) + 1;
      byPriority[feedback.priority] = (byPriority[feedback.priority] || 0) + 1;
    });

    // Get recent activity (last 10 feedback items)
    const recentActivity = await ctx.db
      .query("feedback")
      .withIndex("by_created", (q) => q)
      .order("desc")
      .take(10);

    return {
      total: allFeedback.length,
      byStatus,
      byType,
      byPriority,
      recentActivity: recentActivity.map((feedback) => ({
        _id: feedback._id,
        _creationTime: feedback._creationTime,
        type: feedback.type,
        title: feedback.title,
        status: feedback.status,
        priority: feedback.priority,
        userName: feedback.userName,
        createdAt: feedback.createdAt,
      })),
    };
  },
});

// Delete feedback (admin only)
export const deleteFeedback = mutation({
  args: {
    feedbackId: v.id("feedback"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.feedbackId);
    return null;
  },
}); 