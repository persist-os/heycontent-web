import { v } from "convex/values";

export const messageRoleValidator = v.union(
  v.literal("user"),
  v.literal("assistant")
);

export const messageSchemaFields = {
  // Foreign Keys & User Context
  conversationId: v.id("conversations"),
  userId: v.string(),
  
  // Core Message Data
  content: v.string(),
  role: messageRoleValidator,
  
  // Ordering & Timing
  sequence: v.number(),  // Explicit ordering within conversation (0, 1, 2, ...)
  timestamp: v.number(),  // Message creation time (required)
  
  // Optional Hidden Context
  context: v.optional(v.string()),
  
  // File Attachments - Metadata only, actual files in GCS
  fileAttachments: v.optional(v.array(v.object({
    file_url: v.string(),
    original_filename: v.string(),
    content_type: v.string(),
    file_size: v.number(),
    gcs_url: v.string(),
    uploaded_at: v.string(),
  }))),
  
  // Context Enrichment MAB Metadata
  enrichment_metadata: v.optional(v.any()),
  
  // Context Summary (backend adds this for assistant messages)
  context_summary: v.optional(v.any()),
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),

  // Suggestions
  suggestions: v.optional(v.any()),
  
  // Future Extensions (for gradual rollout)
  editedAt: v.optional(v.number()),
  deletedAt: v.optional(v.number()),  // Soft delete
};

export const messageValidator = v.object(messageSchemaFields);

// Message object validator for API input (no database fields)
export const messageInputValidator = v.object({
  content: v.string(),
  role: messageRoleValidator,
  timestamp: v.number(),
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
  suggestions: v.optional(v.any()),
});

// Message array validator for createConversation
export const messageArrayValidator = v.array(messageInputValidator);

