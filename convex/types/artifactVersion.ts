/**
 * Artifact Version Schema Fields
 * 
 * CRITICAL: Follows CONVEX_SAVE_ABSOLUTE_LAW
 * - Stores full snapshots of artifact versions
 * - Links to artifacts table via artifactId
 * - Maintains version lineage via parentVersionId
 * - Tracks latest version via isLatest flag
 */

import { v } from "convex/values";

export const artifactVersionSchemaFields = {
  // Reference to base artifact (immutable)
  artifactId: v.id("artifacts"),  // Links to artifacts table
  
  // Version identification
  versionNumber: v.number(),  // 1, 2, 3... (incrementing integer)
  isLatest: v.boolean(),  // True for current version, false for historical
  
  // Version content (full snapshot)
  data: v.any(),  // Full artifact data snapshot
  dataModel: v.any(),  // Full dataModel snapshot
  tags: v.optional(v.array(v.string())),
  
  // Version metadata
  createdAt: v.number(),  // When this version was created
  createdBy: v.string(),  // Widget ID or User ID
  editSource: v.union(v.literal("widget"), v.literal("user")),
  
  // Version lineage
  parentVersionId: v.optional(v.id("artifact_versions")),  // Previous version reference
  
  // Storage efficiency fields
  storageType: v.literal("snapshot"),  // MVF: only snapshots
  
  // Execution context
  widgetExecutionId: v.optional(v.string()),  // Which widget run created this
  taskRunId: v.optional(v.string()),  // Which task run created this
};

