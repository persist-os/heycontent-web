/**
 * Assignment Fingerprint Type Definitions - Structured Intelligence
 * 
 * Evolved fingerprint schema with temporal, versioned insights for Living Projects.
 * Enables A2A coordination through structured, queryable intelligence.
 * 
 * Following CONVEX_SAVE_ABSOLUTE_LAW.md:
 * - All field names in camelCase (Convex standard)
 * - Optional fields use v.optional()
 * - No auto-generated fields in createValidator (createdAt/updatedAt set by mutations)
 */

import { v } from "convex/values";

// ============================================================================
// INSIGHT ENTRY VALIDATOR (Temporal, versioned insights)
// ============================================================================

/**
 * Individual insight entry with full temporal context
 * Each insight is:
 * - Timestamped (when captured)
 * - Sourced (which conversation)
 * - Categorized (goals, constraints, timeline, etc.)
 * - Versioned (can supersede previous insights)
 * - Confidence-scored (0-1, for future ranking)
 */
export const insightEntryValidator = v.object({
  id: v.string(),                         // Unique insight ID (generated)
  insight: v.string(),                    // The actual insight text
  timestamp: v.number(),                  // When captured (Date.now())
  conversationId: v.string(),             // Source conversation
  messageCount: v.number(),               // Context window size at capture
  confidence: v.optional(v.number()),     // 0-1 confidence score
  category: v.string(),                   // "goals" | "constraints" | "timeline" | etc.
  tags: v.optional(v.array(v.string())),  // Searchable tags
  supersedes: v.optional(v.array(v.string())), // IDs of insights this replaces
});

// ============================================================================
// SCHEMA FIELDS (for defineTable)
// ============================================================================

export const assignmentFingerprintSchemaFields = {
  projectId: v.id("projects"),
  conversationId: v.optional(v.id("conversations")),
  userId: v.string(),
  
  // NEW: Structured insights array (temporal history)
  insights: v.array(insightEntryValidator),
  
  // NEW: Fast-access summaries (denormalized for performance <10ms)
  currentGoals: v.optional(v.array(v.string())),
  currentConstraints: v.optional(v.array(v.string())),
  currentTimeline: v.optional(v.string()),
  
  // NEW: A2A Coordination Metadata
  widgetPreferences: v.optional(v.object({
    preferredOutputFormats: v.optional(v.array(v.string())),  // ["markdown", "structured_data"]
    draftVsFinal: v.optional(v.string()),                      // "draft_first" | "final_only"
    iterationStyle: v.optional(v.string()),                    // "rapid" | "thorough"
  })),
  
  // NEW: Intelligence Metadata
  version: v.number(),                    // Schema version (start at 1)
  lastEvolution: v.number(),              // When significant change occurred
  totalInsights: v.number(),              // Count for analytics
  
  // Standard metadata
  createdAt: v.number(),
  updatedAt: v.number(),
};

// Wrapped validator for full schema
export const assignmentFingerprintValidator = v.object(assignmentFingerprintSchemaFields);

// ============================================================================
// MUTATION VALIDATORS (Following CONVEX_SAVE_ABSOLUTE_LAW.md)
// ============================================================================

/**
 * Create Assignment Fingerprint Validator
 * Excludes auto-generated fields: _id, createdAt, updatedAt
 * Excludes projectId, userId (passed as separate mutation args)
 */
export const assignmentFingerprintCreateValidator = v.object({
  insights: v.optional(v.array(insightEntryValidator)),
  currentGoals: v.optional(v.array(v.string())),
  currentConstraints: v.optional(v.array(v.string())),
  currentTimeline: v.optional(v.string()),
  widgetPreferences: v.optional(v.object({
    preferredOutputFormats: v.optional(v.array(v.string())),
    draftVsFinal: v.optional(v.string()),
    iterationStyle: v.optional(v.string()),
  })),
  version: v.optional(v.number()),        // Default to 1
  totalInsights: v.optional(v.number()),  // Default to 0
  // NO projectId, NO userId (passed as separate args to mutation)
  // NO createdAt, NO updatedAt, NO _id - Convex sets automatically
});

/**
 * Update Assignment Fingerprint Validator
 * All fields optional - append insights, update summaries
 */
export const assignmentFingerprintUpdateValidator = v.object({
  insights: v.optional(v.array(insightEntryValidator)),  // NEW - append mode
  currentGoals: v.optional(v.array(v.string())),
  currentConstraints: v.optional(v.array(v.string())),
  currentTimeline: v.optional(v.string()),
  widgetPreferences: v.optional(v.object({
    preferredOutputFormats: v.optional(v.array(v.string())),
    draftVsFinal: v.optional(v.string()),
    iterationStyle: v.optional(v.string()),
  })),
  lastEvolution: v.optional(v.number()),
  totalInsights: v.optional(v.number()),
  // NO createdAt (never changes)
  // updatedAt set automatically by mutation
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export interface InsightEntry {
  id: string;
  insight: string;
  timestamp: number;
  conversationId: string;
  messageCount: number;
  confidence?: number;
  category: string;
  tags?: string[];
  supersedes?: string[];
}

export interface WidgetPreferences {
  preferredOutputFormats?: string[];
  draftVsFinal?: string;
  iterationStyle?: string;
}

export interface AssignmentFingerprint {
  _id: string;
  projectId: string;
  userId: string;
  insights: InsightEntry[];
  currentGoals?: string[];
  currentConstraints?: string[];
  currentTimeline?: string;
  widgetPreferences?: WidgetPreferences;
  version: number;
  lastEvolution: number;
  totalInsights: number;
  createdAt: number;
  updatedAt: number;
}
