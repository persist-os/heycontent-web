/**
 * Project File Junction Type Definitions
 * 
 * Many-to-many relationship between files and projects (assignments).
 * Allows same file to be attached to multiple projects.
 * 
 * Following CONVEX_SAVE_ABSOLUTE_LAW.md:
 * - All field names in camelCase (Convex standard)
 * - Optional fields use v.optional()
 * - No auto-generated fields in createValidator (createdAt/updatedAt set by mutations)
 */

import { v } from "convex/values";

// ============================================================================
// SCHEMA FIELDS (for defineTable)
// ============================================================================

export const projectFileSchemaFields = {
  projectId: v.id("projects"),
  fileId: v.id("files"),
  userId: v.string(),                    // Firebase UID (for security)
  
  // Optional metadata
  attachedAt: v.optional(v.number()),     // When attached to this project (defaults to createdAt)
  
  // Standard metadata
  createdAt: v.number(),
  updatedAt: v.number(),
};

// Wrapped validator for full schema
export const projectFileValidator = v.object(projectFileSchemaFields);

// ============================================================================
// MUTATION VALIDATORS (Following CONVEX_SAVE_ABSOLUTE_LAW.md)
// ============================================================================

/**
 * Create Project File Validator
 * Excludes auto-generated fields: _id, createdAt, updatedAt
 * Excludes projectId, fileId, userId (passed as separate mutation args)
 */
export const projectFileCreateValidator = v.object({
  attachedAt: v.optional(v.number()),
  // NO projectId, NO fileId, NO userId (passed as separate args to mutation)
  // NO createdAt, NO updatedAt, NO _id - Convex sets automatically
});

/**
 * Update Project File Validator
 * All fields optional - mainly for metadata updates
 */
export const projectFileUpdateValidator = v.object({
  attachedAt: v.optional(v.number()),
  // NO createdAt (never changes)
  // updatedAt set automatically by mutation
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export interface ProjectFile {
  _id: string;
  projectId: string;
  fileId: string;
  userId: string;
  attachedAt?: number;
  createdAt: number;
  updatedAt: number;
}

