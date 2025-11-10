/**
 * Briefing Event Type Definitions
 * 
 * Autonomous briefing agents that represent events, discoveries, and updates
 * from the AI civilization to the user.
 */

import { v } from "convex/values";

// Briefing category validator
export const briefingCategoryValidator = v.union(
  v.literal("crystal"),
  v.literal("widget"),
  v.literal("collaboration"),
  v.literal("dream"),
  v.literal("system")
);

// Briefing priority validator
export const briefingPriorityValidator = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
);

// Briefing state validator
export const briefingStateValidator = v.union(
  v.literal("forming"),
  v.literal("waiting"),
  v.literal("requesting"),
  v.literal("presenting"),
  v.literal("acknowledged"),
  v.literal("dormant"),
  v.literal("archived")
);

// Briefing user rating validator
export const briefingUserRatingValidator = v.union(
  v.literal("helpful"),
  v.literal("not_helpful"),
  v.literal("irrelevant")
);

// Schema fields for briefing events (unwrapped for defineTable)
export const briefingEventSchemaFields = {
  // Identity
  userId: v.string(),
  type: v.string(),
  category: briefingCategoryValidator,
  
  // Priority & Urgency
  priority: briefingPriorityValidator,
  urgencyLevel: v.number(),
  
  // Temporal Awareness
  timestamp: v.number(),
  lastPresented: v.optional(v.number()),
  timeWaiting: v.number(),
  
  // Event Data (category-specific)
  data: v.any(),
  
  // State Machine
  state: briefingStateValidator,
  stateHistory: v.array(v.object({
    from: v.string(),
    to: v.string(),
    timestamp: v.number(),
    trigger: v.string()
  })),
  
  // Spatial Position
  position: v.object({
    x: v.number(),
    y: v.number(),
    z: v.number()
  }),
  spatialPriority: v.number(),
  
  // Relationships
  relatedBriefings: v.array(v.string()),
  clusterId: v.optional(v.string()),
  
  // User Interaction
  viewed: v.boolean(),
  viewedAt: v.optional(v.number()),
  archived: v.boolean(),
  starred: v.boolean(),
  userRating: v.optional(briefingUserRatingValidator),
  actionsTaken: v.array(v.string()),
  
  // AI Context
  aiContext: v.optional(v.object({
    relatedCrystals: v.array(v.string()),
    relatedProjects: v.array(v.string()),
    relatedWidgets: v.array(v.string()),
    generatedSuggestions: v.array(v.string())
  })),
  
  // Metadata
  metadata: v.object({
    source: v.string(),
    version: v.string(),
    processingTime: v.optional(v.number())
  }),
  
  createdAt: v.number(),
  updatedAt: v.number()
};

// Wrapped validator for mutations/queries
export const briefingEventValidator = v.object(briefingEventSchemaFields);

// Type exports
export type BriefingCategory = "crystal" | "widget" | "collaboration" | "dream" | "system";
export type BriefingPriority = "critical" | "high" | "medium" | "low";
export type BriefingState = "forming" | "waiting" | "requesting" | "presenting" | "acknowledged" | "dormant" | "archived";
export type BriefingUserRating = "helpful" | "not_helpful" | "irrelevant";

export interface BriefingStateHistoryEntry {
  from: string;
  to: string;
  timestamp: number;
  trigger: string;
}

export interface BriefingPosition {
  x: number;
  y: number;
  z: number;
}

export interface BriefingAIContext {
  relatedCrystals: string[];
  relatedProjects: string[];
  relatedWidgets: string[];
  generatedSuggestions: string[];
}

export interface BriefingMetadata {
  source: string;
  version: string;
  processingTime?: number;
}

export interface BriefingEvent {
  userId: string;
  type: string;
  category: BriefingCategory;
  priority: BriefingPriority;
  urgencyLevel: number;
  timestamp: number;
  lastPresented?: number;
  timeWaiting: number;
  data: any;
  state: BriefingState;
  stateHistory: BriefingStateHistoryEntry[];
  position: BriefingPosition;
  spatialPriority: number;
  relatedBriefings: string[];
  clusterId?: string;
  viewed: boolean;
  viewedAt?: number;
  archived: boolean;
  starred: boolean;
  userRating?: BriefingUserRating;
  actionsTaken: string[];
  aiContext?: BriefingAIContext;
  metadata: BriefingMetadata;
  createdAt: number;
  updatedAt: number;
}

