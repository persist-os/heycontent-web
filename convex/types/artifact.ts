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
  v.literal("timeline")         // Timeline events
);

/**
 * Artifact schema fields - matches backend/app/models/artifacts.py EXACTLY
 * 
 * DATA FLOW:
 * 1. AI generates: type, data_model, data, tags
 * 2. Backend adds: metadata, projectId, widgetId, userId
 * 3. Convex auto-generates: _id, createdAt, updatedAt
 */
export const artifactSchemaFields = {
  // AI-GENERATED FIELDS
  type: artifactTypeValidator,
  data_model: v.any(),       // Structure/format (AI generates: {layout, fields, etc})
  data: v.any(),             // Actual content (AI generates: rows, text, events, etc)
  tags: v.optional(v.array(v.string())),  // Categorization (AI generates, optional)
  
  // BACKEND-SET FIELDS
  metadata: v.object({
    version: v.number(),                    // Backend sets (always 1 for new)
    lastUpdatedBy: v.string(),              // Backend sets (widget ID)
    lastUpdatedAt: v.number(),              // Convex sets (timestamp)
    editHistory: v.optional(v.array(v.object({
      timestamp: v.number(),
      widgetId: v.string(),
      changes: v.string()                   // JSON string
    })))
  }),
  
  // BACKEND-SET RELATIONSHIPS (Convex IDs)
  projectId: v.id("projects"),
  widgetId: v.optional(v.id("widgets")),    // Optional: project-level artifacts may not be linked to a widget
  userId: v.string(),                       // Firebase UID (not Convex ID)
  
  // CONVEX AUTO-GENERATED
  createdAt: v.number(),
  updatedAt: v.number()
};

