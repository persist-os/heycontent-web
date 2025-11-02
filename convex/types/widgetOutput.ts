import { v } from "convex/values";
import { widgetOutputArtifactTypeValidator } from "./widgets";

export const widgetOutputSchemaFields = {
  outputId: v.string(),
  widgetId: v.union(v.string(), v.id("widgets")),  // 🔄 Migration: supports both legacy string and Convex ID
  projectId: v.id("projects"),
  userId: v.string(),
  
  // Content
  noteId: v.string(),  // Reference to created note
  openingMessage: v.optional(v.string()),  // AI's first conversational message to start the dialogue
  executionPrompt: v.optional(v.string()),  // User's custom prompt for widget execution
  prompts: v.array(v.object({
    text: v.string(),
    priority: v.number(),
  })),
  
  // Artifact System (Universal Rendering)
  artifactType: v.optional(widgetOutputArtifactTypeValidator),  // Type of structured artifact
  artifactSchema: v.optional(v.any()),  // JSON schema describing artifact structure
  artifactData: v.optional(v.any()),  // The actual structured data
  
  // Collaboration (NEW - multi-widget artifact updates)
  contributors: v.optional(v.array(v.string())),  // Widget IDs that contributed to this artifact
  lastContributor: v.optional(v.string()),  // Last widget/user that edited
  version: v.optional(v.number()),  // Version number for tracking updates
  userApproved: v.optional(v.boolean()),  // Whether user approved this artifact
  userEdits: v.optional(v.array(v.object({
    timestamp: v.number(),
    changes: v.any(),
    userId: v.string(),
  }))),  // User edit history
  
  // Feedback
  userRating: v.optional(v.union(v.literal(1), v.literal(0))),  // 1 = thumbs up, 0 = thumbs down
  feedbackText: v.optional(v.string()),  // Optional text feedback for thumbs down
  ratedAt: v.optional(v.number()),  // Timestamp of rating
  
  // Metadata
  createdAt: v.number(),
};

export const widgetOutputValidator = v.object(widgetOutputSchemaFields);

