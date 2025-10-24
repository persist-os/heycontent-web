import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { contentFeedbackEntityTypeValidator } from "./types/feedback";
import * as contextUsageMutations from "./contextUsageMutations";

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

// ============================================================================
// CONTENT FEEDBACK SYSTEM - For chat messages, notes, and widgets
// ============================================================================

/**
 * Create content feedback (ratings for AI-generated content)
 * Supports chat messages, note generation, and widget outputs
 */
export const createContentFeedback = mutation({
  args: {
    // Entity identification
    entityType: contentFeedbackEntityTypeValidator,
    entityId: v.string(),
    
    // Rating data
    rating: v.number(), // 1-5
    feedbackText: v.optional(v.string()),
    
    // User info
    userId: v.string(),
    userEmail: v.optional(v.string()),
    userName: v.optional(v.string()),
    
    // Context snapshot (comprehensive for all types)
    contentSnapshot: v.object({
      // Chat message fields
      messageContent: v.optional(v.string()),
      conversationId: v.optional(v.string()),
      messageRole: v.optional(v.string()),
      messageSequence: v.optional(v.number()),
      
      // Note generation fields
      noteId: v.optional(v.string()),
      noteTitle: v.optional(v.string()),
      noteContent: v.optional(v.string()),
      noteType: v.optional(v.string()),
      generationType: v.optional(v.string()),
      generationPrompt: v.optional(v.string()),
      
      // Widget output fields
      widgetType: v.optional(v.string()),
      widgetTitle: v.optional(v.string()),
      widgetDescription: v.optional(v.string()),
      outputContent: v.optional(v.string()),
      openingMessage: v.optional(v.string()),
      promptsCount: v.optional(v.number()),
    }),
    
    // Optional context
    projectId: v.optional(v.string()),
    widgetId: v.optional(v.string()),
    page: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    deviceType: v.optional(v.string()),
    browserInfo: v.optional(v.string()),
  },
  returns: v.id("feedback"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Generate descriptive title based on entity type
    const titleMap = {
      chat_message: "Chat message rating",
      note_generation: "Note generation rating",
      widget_output: "Widget output rating",
    };
    
    const feedbackId = await ctx.db.insert("feedback", {
      // Standard feedback fields
      type: "content_rating",
      title: `${titleMap[args.entityType]}: ${args.rating}/5`,
      description: args.feedbackText || `User rated ${args.entityType} as ${args.rating} out of 5`,
      userEmail: args.userEmail || "",
      userName: args.userName || "",
      page: args.page || "",
      userAgent: args.userAgent || "",
      timestamp: now,
      userId: args.userId,
      status: "new",
      priority: args.rating <= 2 ? "high" : args.rating <= 3 ? "medium" : "low",
      assignedTo: undefined,
      tags: [
        args.entityType,
        `rating_${args.rating}`,
        args.rating <= 3 ? "needs_attention" : "positive"
      ],
      screenshots: [],
      discordMessageId: undefined,
      createdAt: now,
      updatedAt: now,
      
      // Content feedback fields
      entityType: args.entityType,
      entityId: args.entityId,
      rating: args.rating,
      feedbackText: args.feedbackText,
      contentSnapshot: args.contentSnapshot,
      projectId: args.projectId,
      widgetId: args.widgetId,
      deviceType: args.deviceType,
      browserInfo: args.browserInfo,
    });

    // Update context usage log with feedback if it exists
    try {
      // Map feedback entity types to context usage output types
      const outputTypeMap: Record<string, string> = {
        "chat_message": "chat",
        "note_generation": "widget_generation",
        "widget_output": "widget",
      };

      const contextOutputType = outputTypeMap[args.entityType] || args.entityType;

      const contextUsageLogs = await ctx.db
        .query("context_usage_logs")
        .withIndex("by_output", (q) =>
          q.eq("outputType", contextOutputType as any).eq("outputId", args.entityId)
        )
        .collect();

      // Update the most recent context usage log with this feedback
      if (contextUsageLogs.length > 0) {
        const latestLog = contextUsageLogs[contextUsageLogs.length - 1];
        await ctx.db.patch(latestLog._id, {
          userFeedback: args.feedbackText || `Rated ${args.rating}/5`,
        });
      }
    } catch (error) {
      // Don't fail feedback creation if context usage update fails
      console.error("[createContentFeedback] Failed to update context usage:", error);
    }

    return feedbackId;
  },
});

/**
 * Get feedback for a specific entity (message, note, or widget)
 */
export const getFeedbackByEntity = query({
  args: {
    entityType: contentFeedbackEntityTypeValidator,
    entityId: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("feedback"),
    rating: v.optional(v.number()),
    feedbackText: v.optional(v.string()),
    createdAt: v.number(),
    userId: v.optional(v.string()),
    userName: v.string(),
  })),
  handler: async (ctx, args) => {
    const feedback = await ctx.db
      .query("feedback")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .order("desc")
      .collect();
    
    return feedback.map(f => ({
      _id: f._id,
      rating: f.rating,
      feedbackText: f.feedbackText,
      createdAt: f.createdAt,
      userId: f.userId,
      userName: f.userName,
    }));
  },
});

/**
 * Get feedback statistics by entity type
 */
export const getFeedbackStatsByType = query({
  args: {
    entityType: contentFeedbackEntityTypeValidator,
    userId: v.optional(v.string()), // Filter by user if provided
  },
  returns: v.object({
    totalCount: v.number(),
    averageRating: v.number(),
    ratingDistribution: v.object({
      rating_1: v.number(),
      rating_2: v.number(),
      rating_3: v.number(),
      rating_4: v.number(),
      rating_5: v.number(),
    }),
    feedbackWithText: v.number(),
  }),
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("feedback")
      .withIndex("by_entity_created", (q) => q.eq("entityType", args.entityType));
    
    const allFeedback = await query.collect();
    
    // Filter by user if provided
    const feedback = args.userId 
      ? allFeedback.filter(f => f.userId === args.userId)
      : allFeedback;
    
    // Calculate statistics
    const ratingDistribution = {
      rating_1: 0,
      rating_2: 0,
      rating_3: 0,
      rating_4: 0,
      rating_5: 0,
    };
    
    let totalRating = 0;
    let feedbackWithTextCount = 0;
    
    feedback.forEach(f => {
      if (f.rating) {
        totalRating += f.rating;
        const key = `rating_${f.rating}` as keyof typeof ratingDistribution;
        ratingDistribution[key]++;
      }
      if (f.feedbackText && f.feedbackText.trim().length > 0) {
        feedbackWithTextCount++;
      }
    });
    
    const averageRating = feedback.length > 0 ? totalRating / feedback.length : 0;
    
    return {
      totalCount: feedback.length,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution,
      feedbackWithText: feedbackWithTextCount,
    };
  },
});

/**
 * Get recent low-rated content (for monitoring/alerts)
 */
export const getLowRatedContent = query({
  args: {
    entityType: v.optional(contentFeedbackEntityTypeValidator),
    maxRating: v.optional(v.number()), // Default 3
    limit: v.optional(v.number()), // Default 20
  },
  returns: v.array(v.object({
    _id: v.id("feedback"),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    rating: v.optional(v.number()),
    feedbackText: v.optional(v.string()),
    contentSnapshot: v.optional(v.any()),
    createdAt: v.number(),
    userId: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const maxRating = args.maxRating ?? 3;
    const limit = args.limit ?? 20;

    let allFeedback;

    if (args.entityType) {
      // Use index for entity-specific queries
      allFeedback = await ctx.db
        .query("feedback")
        .withIndex("by_entity_created", (q) =>
          q.eq("entityType", args.entityType)
        )
        .order("desc")
        .take(limit * 3);
    } else {
      // Use general index for all feedback queries
      allFeedback = await ctx.db
        .query("feedback")
        .withIndex("by_created", (q) => q)
        .order("desc")
        .take(limit * 3);
    }
    
    // Filter by rating
    const lowRated = allFeedback
      .filter(f => f.rating !== undefined && f.rating <= maxRating)
      .slice(0, limit);
    
    return lowRated.map(f => ({
      _id: f._id,
      entityType: f.entityType,
      entityId: f.entityId,
      rating: f.rating,
      feedbackText: f.feedbackText,
      contentSnapshot: f.contentSnapshot,
      createdAt: f.createdAt,
      userId: f.userId,
    }));
  },
}); 