import { v } from "convex/values";

/**
 * Universal Prompt Block Schema
 * 
 * Flexible prompt system that supports:
 * - Platform-level prompts (all widgets inherit)
 * - Project-level prompts (all widgets in project)
 * - Widget-level prompts (specific to widget family)
 * - Operation-level prompts (specific operations)
 * - Learned prompts (discovered through execution feedback)
 * 
 * Prompts are composable blocks tagged for discovery.
 */

// Prompt type validator
export const promptTypeValidator = v.union(
  v.literal("block"),      // Reusable building block
  v.literal("fragment"),   // Partial prompt piece
  v.literal("complete"),   // Full standalone prompt
  v.literal("learned")     // Auto-generated from learning
);

// Prompt scope validator
export const promptScopeValidator = v.union(
  v.literal("platform"),   // All widgets
  v.literal("project"),    // All widgets in project
  v.literal("widget"),     // Specific widget
  v.literal("operation"),  // Specific operation
  v.literal("user")        // User-specific
);

// Prompt block schema fields
export const promptSchemaFields = {
  // Core content
  content: v.string(),  // The actual prompt text
  
  // Classification
  type: promptTypeValidator,
  
  // Discovery (critical for querying)
  tags: v.array(v.string()),  // ["platform", "task-tracker", "information-check"]
  
  // Scope (who owns this)
  scope: promptScopeValidator,
  scopeId: v.optional(v.string()),  // ID of project/widget/user
  
  // Learning metrics
  effectiveness: v.optional(v.number()),  // 0.0 to 1.0
  usageCount: v.optional(v.number()),
  successRate: v.optional(v.number()),
  
  // Evolution tracking
  version: v.string(),  // "1.0.0"
  parentId: v.optional(v.id("prompts")),  // For forked/evolved prompts
  
  // Metadata
  createdBy: v.string(),
  description: v.optional(v.string()),
  
  // Timestamps auto-handled by Convex
  // _creationTime provided automatically
};

