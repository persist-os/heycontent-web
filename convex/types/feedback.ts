import { v } from "convex/values";

export const feedbackTypeValidator = v.union(
  v.literal("bug"),
  v.literal("feature_request"),
  v.literal("general"),
  v.literal("praise"),
  v.literal("content_rating")
);

export const contentFeedbackEntityTypeValidator = v.union(
  v.literal("chat_message"),
  v.literal("note_generation"),
  v.literal("widget_output"),
  v.literal("artifact")
);

export const feedbackStatusValidator = v.union(
  v.literal("new"),
  v.literal("in_progress"),
  v.literal("resolved"),
  v.literal("closed")
);

export const feedbackPriorityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("urgent")
);

export const feedbackSchemaFields = {
  type: v.string(), // "bug", "feature_request", "general", "praise", "content_rating"
  title: v.string(),
  description: v.string(),
  userEmail: v.string(),
  userName: v.string(),
  page: v.string(),
  userAgent: v.string(),
  timestamp: v.number(),
  userId: v.optional(v.string()), // Firebase user ID
  status: v.string(), // "new", "in_progress", "resolved", "closed"
  priority: v.string(), // "low", "medium", "high", "urgent"
  assignedTo: v.optional(v.string()),
  tags: v.array(v.string()),
  screenshots: v.array(v.object({
    name: v.string(),
    size: v.number(),
    type: v.string(),
    url: v.optional(v.string()) // If we store files in Convex storage
  })),
  discordMessageId: v.optional(v.string()), // To link back to Discord
  createdAt: v.number(),
  updatedAt: v.number(),

  // Content feedback fields (optional for backward compatibility)
  entityType: v.optional(contentFeedbackEntityTypeValidator),
  entityId: v.optional(v.string()),
  rating: v.optional(v.number()),
  feedbackText: v.optional(v.string()),
  contentSnapshot: v.optional(v.any()),

  // Additional context fields
  projectId: v.optional(v.string()),
  widgetId: v.optional(v.string()),
  deviceType: v.optional(v.string()),
  browserInfo: v.optional(v.string()),
};

export const feedbackValidator = v.object(feedbackSchemaFields);

