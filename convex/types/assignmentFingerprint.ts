/**
 * Assignment Fingerprint Type Definitions
 * 
 * Simplified fingerprint schema for tracking project understanding and AI usage intent.
 * This replaces the complex old project_fingerprints with a clean, Living Projects paradigm.
 * 
 * Following CONVEX_SAVE_ABSOLUTE_LAW.md:
 * - All field names in camelCase (Convex standard)
 * - Optional fields use v.optional()
 * - No auto-generated fields in schema (createdAt/updatedAt set by mutations)
 */

import { v } from "convex/values";

// Schema fields (unwrapped for defineTable)
export const assignmentFingerprintSchemaFields = {
  projectId: v.id("projects"),
  userId: v.string(),
  
  // Project Understanding (from conversation)
  goals: v.optional(v.string()),
  constraints: v.optional(v.string()),
  timeline: v.optional(v.string()),
  people: v.optional(v.string()),
  requirements: v.optional(v.string()),
  context: v.optional(v.string()),
  
  // AI Usage Intent (critical for widget generation)
  artifactsNeeded: v.optional(v.string()),
  helpWanted: v.optional(v.string()),
  workingStyle: v.optional(v.string()),
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  messageCount: v.number(), // Track which message triggered update
};

// Wrapped validator for mutations/queries (full schema)
export const assignmentFingerprintValidator = v.object(assignmentFingerprintSchemaFields);

// ============================================================================
// MUTATION VALIDATORS (Following CONVEX_SAVE_ABSOLUTE_LAW.md)
// ============================================================================

/**
 * Create Assignment Fingerprint Validator
 * Excludes auto-generated fields: _id, createdAt, updatedAt
 * These are set automatically by Convex
 */
export const assignmentFingerprintCreateValidator = v.object({
  projectId: v.id("projects"),
  userId: v.string(),
  goals: v.optional(v.string()),
  constraints: v.optional(v.string()),
  timeline: v.optional(v.string()),
  people: v.optional(v.string()),
  requirements: v.optional(v.string()),
  context: v.optional(v.string()),
  artifactsNeeded: v.optional(v.string()),
  helpWanted: v.optional(v.string()),
  workingStyle: v.optional(v.string()),
  messageCount: v.number(),
  // NO createdAt, NO updatedAt, NO _id
  // Convex sets these automatically
});

/**
 * Update Assignment Fingerprint Validator
 * All insight fields optional - update only what's provided
 */
export const assignmentFingerprintUpdateValidator = v.object({
  goals: v.optional(v.string()),
  constraints: v.optional(v.string()),
  timeline: v.optional(v.string()),
  people: v.optional(v.string()),
  requirements: v.optional(v.string()),
  context: v.optional(v.string()),
  artifactsNeeded: v.optional(v.string()),
  helpWanted: v.optional(v.string()),
  workingStyle: v.optional(v.string()),
  messageCount: v.optional(v.number()),
  // NO createdAt (never changes)
  // updatedAt set automatically by mutation
});

// Type exports
export interface AssignmentFingerprint {
  _id: string;
  projectId: string;
  userId: string;
  goals?: string;
  constraints?: string;
  timeline?: string;
  people?: string;
  requirements?: string;
  context?: string;
  artifactsNeeded?: string;
  helpWanted?: string;
  workingStyle?: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
}

