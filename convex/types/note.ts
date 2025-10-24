import { v } from "convex/values";

export const noteTypeValidator = v.union(
  v.literal("idea_bank"),
  v.literal("content_script"),
  v.literal("collaboration_note"),
  v.literal("analytics_insight"),
  v.literal("reflection_journal"),
  v.literal("task_checklist"),
  v.literal("email_draft"),
  v.literal("idea") // Legacy type for existing notes
);

export const noteSchemaFields = {
  userId: v.string(),
  title: v.string(),
  content: v.optional(v.string()),
  important: v.optional(v.boolean()),
  platform: v.optional(v.string()),
  references: v.optional(v.array(v.string())),
  type: v.optional(noteTypeValidator),
  tags: v.array(v.string()),
  analysis: v.optional(v.string()),
  images: v.optional(v.array(v.object({
    url: v.string(),
    filename: v.string(),
    originalFilename: v.optional(v.string()),
    uploadedAt: v.number(),
    size: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number())
  }))),
  sourceConversationId: v.optional(v.string()),
  folderId: v.optional(v.id("folders")), // Reference to parent folder
  createdAt: v.number(),
  updatedAt: v.number(),
  titleGenerated: v.optional(v.boolean()),
  typeGenerated: v.optional(v.boolean()),
  
  // Widget linkage
  widgetId: v.optional(v.union(v.string(), v.id("widgets"))),  // 🔄 Migration: supports both legacy string and Convex ID
  isWidgetOutput: v.optional(v.boolean()),
  projectId: v.optional(v.id("projects")),
  widgetOutputId: v.optional(v.string()), // Links to specific widget output
};

export const noteValidator = v.object(noteSchemaFields);

