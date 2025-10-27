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
  
  // Content ID Arrays - Enable efficient batch content fetching
  noteIds: v.optional(v.array(v.string())),
  conversationIds: v.optional(v.array(v.string())),
  stardustIds: v.optional(v.array(v.string())),
  crystalIds: v.optional(v.array(v.string())),
  shardIds: v.optional(v.array(v.string())),
  
  // AI Intelligence Integration
  fingerprintId: v.optional(v.id("project_fingerprints")),
  analysisIds: v.optional(v.array(v.string())),
  
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

// Wrapped validator for mutations/queries
export const projectValidator = v.object(projectSchemaFields);

// Type exports
export type ConstellationItemType = "widget" | "note" | "conversation" | "crystal" | "shard" | "stardust";

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
  noteIds?: string[];
  conversationIds?: string[];
  stardustIds?: string[];
  crystalIds?: string[];
  shardIds?: string[];
  fingerprintId?: string;
  analysisIds?: string[];
  constellationLayout?: ConstellationLayout;
  createdAt: number;
  updatedAt: number;
}

