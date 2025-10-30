/**
 * Content Embedding Type Definitions
 * 
 * CRITICAL: Single source of truth for embedding content types
 * Used across schema, validators, mutations, queries, and backend
 */

import { v } from "convex/values";

/**
 * Content types that support embeddings
 * SINGLE SOURCE OF TRUTH - all files import from here
 */
export const contentTypeValidator = v.union(
  v.literal("conversation"),
  v.literal("note"),
  v.literal("cognitive_field"),
  v.literal("crystal"), // Keep for backwards compatibility with existing data
  v.literal("shard"),
  v.literal("stardust")
);

/**
 * TypeScript type derived from validator
 */
export type ContentType = "conversation" | "note" | "cognitive_field" | "crystal" | "shard" | "stardust";

/**
 * Array of content types validator - for filters
 */
export const contentTypesArrayValidator = v.optional(v.array(contentTypeValidator));

/**
 * All valid content types as constant array
 */
export const CONTENT_TYPES: readonly ContentType[] = ["conversation", "note", "cognitive_field", "crystal", "shard", "stardust"] as const;

/**
 * Embedding operation types
 */
export const embeddingOperationValidator = v.union(
  v.literal("create_embedding_record"),
  v.literal("batch_delete_embeddings"),
  v.literal("delete_all_embeddings")
);

export type EmbeddingOperation = "create_embedding_record" | "batch_delete_embeddings" | "delete_all_embeddings";

