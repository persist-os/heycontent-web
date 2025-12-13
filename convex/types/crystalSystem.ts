/**
 * Crystal OS System Schema
 * 
 * Stores persistent Crystal OS system state per user/agent combination.
 * Used by Crystal OS API Extension (Phase 5) for learning and evolution.
 */

import { v } from "convex/values";

/**
 * Crystal System Schema Fields
 * 
 * Stores serialized CrystalSystem state:
 * - config: System configuration
 * - memory: Memory state (if enabled)
 * - evolution: Evolution state (if enabled)
 */
export const crystalSystemSchemaFields = {
  // System key: "user_id:agent_type" (unique identifier)
  systemKey: v.string(),
  
  // User ID (for queries)
  userId: v.string(),
  
  // Agent type (for queries)
  agentType: v.string(),
  
  // Serialized system data (JSON)
  config: v.any(),  // System configuration
  memory: v.optional(v.any()),  // Memory state (if enabled)
  evolution: v.optional(v.any()),  // Evolution state (if enabled)
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
};

/**
 * Crystal System Create Validator
 */
export const crystalSystemCreateValidator = v.object({
  systemKey: v.string(),
  userId: v.string(),
  agentType: v.string(),
  config: v.any(),
  memory: v.optional(v.any()),
  evolution: v.optional(v.any()),
});

/**
 * Crystal System Update Validator
 */
export const crystalSystemUpdateValidator = v.object({
  config: v.optional(v.any()),
  memory: v.optional(v.any()),
  evolution: v.optional(v.any()),
});

