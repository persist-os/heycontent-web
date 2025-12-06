/**
 * Dedicated artifacts table - clean separation from execution tracking.
 * Matches TypeScript interface exactly.
 */

import { v } from "convex/values";

// Artifact type validator - matches Python Literal and TypeScript union exactly
export const artifactTypeValidator = v.union(
  v.literal("structured_list"),
  v.literal("report"),          // Markdown reports
  v.literal("analysis"),        // Data insights with charts
  v.literal("summary"),         // KPI metrics
  v.literal("tracker"),         // Execution logs
  v.literal("timeline"),        // Timeline events
  v.literal("email")            // Email artifacts
);

/**
 * Artifact schema fields - matches backend/app/models/artifacts.py EXACTLY
 * 
 * DATA FLOW:
 * 1. AI generates: type, title, data_model, data, tags
 * 2. Backend adds: metadata, projectId, widgetId, userId
 * 3. Convex auto-generates: _id, createdAt, updatedAt
 */
export const artifactSchemaFields = {
  // AI-GENERATED FIELDS
  type: artifactTypeValidator,
  title: v.optional(v.string()),  // Human-readable artifact title (AI generates, optional)
  data_model: v.any(),       // Structure/format (AI generates: {layout, fields, etc})
  data: v.any(),             // Actual content (AI generates: rows, text, events, etc)
  tags: v.optional(v.array(v.string())),  // Categorization (AI generates, optional)
  
  // BACKEND-SET FIELDS
  metadata: v.object({
    version: v.number(),                    // Backend sets (always 1 for new), incremented on each update
    lastUpdatedBy: v.string(),              // Backend sets (widget ID or user ID)
    lastUpdatedAt: v.number(),              // Convex sets (timestamp)
    editSource: v.optional(v.union(v.literal("widget"), v.literal("user"))),  // NEW: Distinguish widget vs user edits
    editHistory: v.optional(v.array(v.object({
      timestamp: v.number(),
      widgetId: v.optional(v.string()),     // Optional: user edits don't have widgetId
      userId: v.optional(v.string()),       // Optional: widget edits don't have userId
      editSource: v.optional(v.union(v.literal("widget"), v.literal("user"))),  // NEW: Track edit source
      changes: v.string()                   // JSON string
    }))),
    qualityMetrics: v.optional(v.object({   // PHASE 5: Quality metrics tracking
      qualityScore: v.number(),            // Overall quality score (0-100)
      completeness: v.number(),             // Completeness metric (0-100)
      usefulness: v.number(),              // Usefulness metric (0-100)
      accuracy: v.number(),                 // Accuracy metric (0-100)
      timestamp: v.number()                 // When metrics were calculated
    }))
  }),
  
  // BACKEND-SET RELATIONSHIPS (Convex IDs)
  projectId: v.id("projects"),
  widgetId: v.optional(v.id("widgets")),    // Optional: project-level artifacts may not be linked to a widget
  conversationId: v.optional(v.id("conversations")),
  userId: v.string(),                       // Firebase UID (not Convex ID)
  
  // QUALITY GATE FIELDS (PHASE 2: Deduplication)
  fingerprint: v.optional(v.string()),      // Content fingerprint for deduplication (hash of data + type)
  
  // CONVEX AUTO-GENERATED
  createdAt: v.number(),
  updatedAt: v.number()
};

// ============================================================================
// ARTIFACT VALIDATORS FOR MUTATIONS
// ============================================================================

/**
 * Artifact metadata validator - used in create and update operations
 */
export const artifactMetadataValidator = v.object({
  version: v.number(),
  lastUpdatedBy: v.string(),
  editSource: v.optional(v.union(v.literal("widget"), v.literal("user"))),
  qualityMetrics: v.optional(v.object({   // PHASE 5: Quality metrics tracking
    qualityScore: v.number(),
    completeness: v.number(),
    usefulness: v.number(),
    accuracy: v.number(),
    timestamp: v.number()
  }))
});

/**
 * Artifact create validator - all fields needed for creation
 * Backend sends: type, title, dataModel, data, tags, metadata, projectId, userId, widgetId (optional), conversationId (optional)
 */
export const artifactCreateValidator = v.object({
  // AI-generated
  type: artifactTypeValidator,
  title: v.optional(v.string()),  // Human-readable artifact title
  dataModel: v.any(),
  data: v.any(),
  tags: v.optional(v.array(v.string())),
  
  // Backend-set
  metadata: artifactMetadataValidator,
  projectId: v.id("projects"),
  widgetId: v.optional(v.id("widgets")),  // Optional: project-level artifacts may not link to a widget
  conversationId: v.optional(v.id("conversations")),  // Optional: conversation-level artifacts
  userId: v.string(),
  fingerprint: v.optional(v.string()),  // Content fingerprint for deduplication (PHASE 2)
});

/**
 * Artifact update validator - only fields that can be updated
 * Only data and tags can be updated (type and relationships are immutable)
 */
export const artifactUpdateValidator = v.object({
  artifactId: v.id("artifacts"),
  data: v.optional(v.any()),
  dataModel: v.optional(v.any()),  // ✅ NEW: Allow dataModel updates
  tags: v.optional(v.array(v.string())),
  updatedBy: v.string(), // widget_id or user_id
  editSource: v.optional(v.union(v.literal("widget"), v.literal("user"))),  // Track edit source
  expectedVersion: v.optional(v.number()),  // Optimistic concurrency control
  skipVersion: v.optional(v.boolean()),  // Skip version creation (e.g., for sends, not content edits)
  qualityMetrics: v.optional(v.object({   // PHASE 5: Quality metrics tracking
    qualityScore: v.number(),
    completeness: v.number(),
    usefulness: v.number(),
    accuracy: v.number(),
    timestamp: v.number()
  }))
});

/**
 * Artifact delete validator - simple ID-based deletion
 */
export const artifactDeleteValidator = v.object({
  artifactId: v.id("artifacts"),
});

