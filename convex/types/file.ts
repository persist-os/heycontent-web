/**
 * File Type Definitions
 * 
 * Tracks uploaded files independently of conversations/messages.
 * Enables many-to-many relationships with projects (assignments).
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

export const fileSchemaFields = {
  userId: v.string(),                    // Firebase UID (not Convex ID)
  
  // File metadata from upload
  originalFilename: v.string(),           // User's original filename
  filename: v.string(),                   // Stored filename (may differ if conflicts resolved)
  contentType: v.string(),                // MIME type
  fileSize: v.number(),                   // Size in bytes
  gcsUrl: v.string(),                     // Google Cloud Storage URL (gs://bucket/path)
  fileUrl: v.string(),                    // Serving URL for frontend display
  
  // Optional conversation context (if uploaded from chat)
  conversationId: v.optional(v.id("conversations")),
  
  // Standard metadata
  createdAt: v.number(),
  updatedAt: v.number(),
};

// Wrapped validator for full schema
export const fileValidator = v.object(fileSchemaFields);

// ============================================================================
// MUTATION VALIDATORS (Following CONVEX_SAVE_ABSOLUTE_LAW.md)
// ============================================================================

/**
 * Create File Validator
 * Excludes auto-generated fields: _id, createdAt, updatedAt
 * Excludes userId (passed as separate mutation arg)
 */
export const fileCreateValidator = v.object({
  originalFilename: v.string(),
  filename: v.string(),
  contentType: v.string(),
  fileSize: v.number(),
  gcsUrl: v.string(),
  fileUrl: v.string(),
  conversationId: v.optional(v.id("conversations")),
  // NO userId (passed as separate arg to mutation)
  // NO createdAt, NO updatedAt, NO _id - Convex sets automatically
});

/**
 * Update File Validator
 * All fields optional - mainly for metadata updates
 */
export const fileUpdateValidator = v.object({
  originalFilename: v.optional(v.string()),
  filename: v.optional(v.string()),
  contentType: v.optional(v.string()),
  fileSize: v.optional(v.number()),
  gcsUrl: v.optional(v.string()),
  fileUrl: v.optional(v.string()),
  conversationId: v.optional(v.id("conversations")),
  // NO createdAt (never changes)
  // updatedAt set automatically by mutation
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export interface File {
  _id: string;
  userId: string;
  originalFilename: string;
  filename: string;
  contentType: string;
  fileSize: number;
  gcsUrl: string;
  fileUrl: string;
  conversationId?: string;
  createdAt: number;
  updatedAt: number;
}

