import { v } from "convex/values";

export const conversationTypeValidator = v.union(
  v.literal("general"),
  v.literal("widget_prompt"),
  v.literal("project_scoped"),
  v.literal("discovery")
);

export const conversationSchemaFields = {
  userId: v.string(),
  title: v.string(),
  
  // 🔄 DUAL-WRITE MIGRATION: messages array kept during migration
  // Will be removed after migration complete
  messages: v.optional(v.array(v.object({
    content: v.string(),
    role: v.string(),
    timestamp: v.optional(v.number()),
    context: v.optional(v.string()),
    fileAttachments: v.optional(v.array(v.object({
      file_url: v.string(),
      original_filename: v.string(),
      content_type: v.string(),
      file_size: v.number(),
      gcs_url: v.string(),
      uploaded_at: v.string(),
    }))),
    enrichment_metadata: v.optional(v.any()),
    context_summary: v.optional(v.any()),
    // Family message fields (Task 2.2 - optional for backward compatibility)
    contentType: v.optional(v.union(
      v.literal("text"),
      v.literal("family_question"),
      v.literal("family_update"),
      v.literal("preflight_questions")
    )),
    familyMetadata: v.optional(v.object({
      familyId: v.union(v.string(), v.id("widgets")),
      familyName: v.string(),
      questionId: v.optional(v.id("widget_questions")),
      context: v.optional(v.string())
    }))
  }))),
  
  // Message statistics (denormalized for performance)
  messageCount: v.optional(v.number()),  // Optional during migration, will be required after
  lastMessageAt: v.optional(v.number()),
  
  createdAt: v.number(),
  updatedAt: v.number(),
  starred: v.boolean(),
  
  // Project & Widget Context - Links conversations to their originating context
  projectId: v.optional(v.id("projects")),
  widgetId: v.optional(v.union(v.string(), v.id("widgets"))),
  widgetOutputId: v.optional(v.string()),
  
  // Conversation type/source for filtering and UI
  conversationType: v.optional(conversationTypeValidator),
  
  // Dynamic suggestions - Generated asynchronously after response
  suggestions: v.optional(v.array(v.string())),
  
  // 🔄 MIGRATION TRACKING: Temporary fields for migration
  migrated: v.optional(v.boolean()),  // Track migration status
  migrationVerified: v.optional(v.boolean()),  // Verify data integrity
};

export const conversationValidator = v.object(conversationSchemaFields);

