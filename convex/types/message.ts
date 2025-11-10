import { v } from "convex/values";

export const messageRoleValidator = v.union(
  v.literal("user"),
  v.literal("assistant")
);

// Family metadata validator - reusable across schema and input validators
export const familyMetadataValidator = v.object({
  familyId: v.union(v.string(), v.id("widgets")),
  familyName: v.string(),
  context: v.optional(v.string()),  // Why asking
  agentName: v.optional(v.string()),  // Widget agent name (e.g., "Preflight Question Generator")
});

// Artifact metadata validator - reusable across schema and input validators
export const artifactMetadataValidator = v.object({
  artifactId: v.string(),
  artifactType: v.string(),
  familyId: v.union(v.string(), v.id("widgets")),
  familyName: v.string()
});

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
  
  // Message Content Types (OPTIONAL for backward compatibility)
  contentType: v.optional(v.string()),
  
  // Family-specific metadata (OPTIONAL for backward compatibility)
  familyMetadata: v.optional(familyMetadataValidator),
  
  // Artifact-specific metadata (OPTIONAL for artifact creation messages)
  artifactMetadata: v.optional(artifactMetadataValidator),
  
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
  
  // MAB Decision IDs (for feedback loop)
  decisionId: v.optional(v.string()),  // Model selection decision ID
  contextDecisionId: v.optional(v.string()),  // Context enrichment decision ID
  
  // Context Summary (backend adds this for assistant messages)
  context_summary: v.optional(v.any()),
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),

  // DEPRECATED: Embedding field (now stored in contentEmbeddings table)
  // Kept for backward compatibility during migration, will be removed
  // embedding: v.optional(v.array(v.number())),  // 768d Google text-embedding-004

  // Suggestions
  suggestions: v.optional(v.any()),
  
  // A2A Metadata (for agent-to-agent announcements)
  a2aMetadata: v.optional(v.any()),
  
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
  contentType: v.optional(v.string()),
  familyMetadata: v.optional(familyMetadataValidator),
  artifactMetadata: v.optional(artifactMetadataValidator),
  fileAttachments: v.optional(v.array(v.object({
    file_url: v.string(),
    original_filename: v.string(),
    content_type: v.string(),
    file_size: v.number(),
    gcs_url: v.string(),
    uploaded_at: v.string(),
  }))),
  enrichment_metadata: v.optional(v.any()),
  decisionId: v.optional(v.string()),  // Model selection decision ID
  contextDecisionId: v.optional(v.string()),  // Context enrichment decision ID
  context_summary: v.optional(v.any()),
  suggestions: v.optional(v.any()),
  a2aMetadata: v.optional(v.any()),  // A2A announcement metadata
});

// Message array validator for createConversation
export const messageArrayValidator = v.array(messageInputValidator);

