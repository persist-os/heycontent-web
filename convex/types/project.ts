/**
 * Project Type Definitions
 * 
 * Projects serve as containers for all user-generated content including notes,
 * conversations, crystals, and shards. The content ID arrays enable efficient
 * batch fetching and filtering.
 */

import { v } from "convex/values";

// Schema fields (unwrapped for defineTable)
export const projectSchemaFields = {
  userId: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  
  // Primary Conversation (1:1 relationship for Unified Assignments)
  conversationId: v.optional(v.string()),
  
  // Unified Cognitive Field (1:1 relationship for Unified Assignments)
  cognitiveFieldId: v.optional(v.id("cognitive_fields")),
  
  // Content ID Arrays - Enable efficient batch content fetching
  noteIds: v.optional(v.array(v.string())),
  conversationIds: v.optional(v.array(v.string())),
  stardustIds: v.optional(v.array(v.string())),
  crystalIds: v.optional(v.array(v.string())),
  cognitiveFieldIds: v.optional(v.array(v.string())),
  shardIds: v.optional(v.array(v.string())),
  widgetIds: v.optional(v.array(v.id("widgets"))),
  artifactIds: v.optional(v.array(v.id("artifacts"))),
  
  // AI Intelligence Integration
  fingerprintId: v.optional(v.any()),
  analysisIds: v.optional(v.array(v.string())),
  
  // Budget Tracking (ON HOLD - placeholders for future usage tracking)
  dailyLlmBudget: v.optional(v.number()),           // User-set limit (default 50)
  llmCallsToday: v.optional(v.number()),            // Current usage
  budgetLastReset: v.optional(v.number()),          // Timestamp of last reset
  isActive: v.optional(v.boolean()),                // Active/inactive state
  
  // Project Status Lifecycle
  status: v.optional(v.union(
    v.literal("fresh"),
    v.literal("working"),
    v.literal("stable"),
    v.literal("sleeping"),
    v.literal("archived")
  )),
  
  // Constellation Layout Cache (recalculated manually)
  constellationLayout: v.optional(v.object({
    version: v.number(),
    calculatedAt: v.number(),
    items: v.array(v.object({
      itemId: v.string(),
      itemType: v.union(
        v.literal("widget"),
        v.literal("note"),
        v.literal("conversation"),
        v.literal("crystal"),
        v.literal("cognitiveField"),
        v.literal("shard"),
        v.literal("stardust")
      ),
      x: v.number(),
      y: v.number(),
      size: v.string(),
      importance: v.number(),
    })),
    canvasWidth: v.number(),
    canvasHeight: v.number(),
  })),
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
};

// Wrapped validator for mutations/queries (full schema)
export const projectValidator = v.object(projectSchemaFields);

// ============================================================================
// MUTATION VALIDATORS (Following CONVEX_SAVE_ABSOLUTE_LAW.md)
// ============================================================================

/**
 * Create Project Validator
 * Excludes auto-generated fields: _id, createdAt, updatedAt, status
 * Excludes optional system fields set by Convex
 */
export const projectCreateValidator = v.object({
  userId: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  conversationId: v.optional(v.string()),  // Primary conversation (1:1)
  noteIds: v.optional(v.array(v.string())),
  conversationIds: v.optional(v.array(v.string())),
  crystalIds: v.optional(v.array(v.string())),
  cognitiveFieldIds: v.optional(v.array(v.string())),
  shardIds: v.optional(v.array(v.string())),
  stardustIds: v.optional(v.array(v.string())),
  widgetIds: v.optional(v.array(v.id("widgets"))),
  artifactIds: v.optional(v.array(v.id("artifacts"))),
  // NO createdAt, NO updatedAt, NO status, NO _id
  // Convex sets these automatically
});

/**
 * Update Project Validator
 * All fields optional - update only what's provided
 */
export const projectUpdateValidator = v.object({
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  conversationId: v.optional(v.string()),  // Primary conversation (1:1)
  status: v.optional(v.union(
    v.literal("fresh"),
    v.literal("working"),
    v.literal("stable"),
    v.literal("sleeping"),
    v.literal("archived")
  )),
  // Budget tracking fields (system-controlled)
  dailyLlmBudget: v.optional(v.number()),
  llmCallsToday: v.optional(v.number()),
  budgetLastReset: v.optional(v.number()),
  isActive: v.optional(v.boolean()),
  // Content ID arrays (system-controlled, updated atomically)
  widgetIds: v.optional(v.array(v.id("widgets"))),
  artifactIds: v.optional(v.array(v.id("artifacts"))),
  // NO createdAt (never changes)
  // updatedAt set automatically by mutation
});

/**
 * Content Type Union (for add/remove operations)
 */
export const contentTypeValidator = v.union(
  v.literal("note"),
  v.literal("conversation"),
  v.literal("crystal"),
  v.literal("cognitiveField"),
  v.literal("shard"),
  v.literal("stardust"),
  v.literal("artifact")
);

/**
 * Constellation Layout Validator (for save operations)
 */
export const constellationLayoutValidator = v.object({
  version: v.number(),
  calculatedAt: v.number(),
  items: v.array(v.object({
    itemId: v.string(),
    itemType: v.union(
      v.literal("widget"),
      v.literal("note"),
      v.literal("conversation"),
      v.literal("crystal"),
      v.literal("cognitiveField"),
      v.literal("shard"),
      v.literal("stardust")
    ),
    x: v.number(),
    y: v.number(),
    size: v.string(),
    importance: v.number(),
  })),
  canvasWidth: v.number(),
  canvasHeight: v.number(),
});

// Type exports
export type ConstellationItemType = "widget" | "note" | "conversation" | "crystal" | "cognitiveField" | "shard" | "stardust";

export interface ConstellationItem {
  itemId: string;
  itemType: ConstellationItemType;
  x: number;
  y: number;
  size: string;
  importance: number;
}

export interface ConstellationLayout {
  version: number;
  calculatedAt: number;
  items: ConstellationItem[];
  canvasWidth: number;
  canvasHeight: number;
}

export interface Project {
  userId: string;
  name: string;
  description?: string;
  conversationId?: string;  // Primary conversation (1:1 relationship)
  noteIds?: string[];
  conversationIds?: string[];
  stardustIds?: string[];
  crystalIds?: string[];
  cognitiveFieldIds?: string[];
  shardIds?: string[];
  widgetIds?: string[];
  artifactIds?: string[];
  fingerprintId?: any;
  analysisIds?: string[];
  // Budget tracking (placeholders - ON HOLD)
  dailyLlmBudget: number;
  llmCallsToday: number;
  budgetLastReset: number;
  isActive: boolean;
  status?: "fresh" | "working" | "stable" | "sleeping" | "archived";
  constellationLayout?: ConstellationLayout;
  createdAt: number;
  updatedAt: number;
}

