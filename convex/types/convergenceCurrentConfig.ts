import { v } from "convex/values";

export const convergenceCurrentConfigSchemaFields = {
  user_id: v.string(),              // User who owns this config
  config_id: v.string(),            // Unique identifier for this config instance
  preset_id: v.optional(v.string()), // If from preset, which preset
  name: v.string(),                 // Display name
  description: v.string(),         // Description
  
  // Configuration data ready for Convergence SDK
  config: v.any(),                  // Prepared config dict for SDK
  test_cases: v.any(),              // Test cases embedded in config
  evaluator_code: v.optional(v.string()), // Custom evaluator if any
  
  // Metadata
  system_name: v.string(),          // "context_enrichment", etc.
  algorithm: v.string(),            // "mab_evolution", etc.
  status: v.string(),               // "ready", "running", "completed"
  
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const convergenceCurrentConfigValidator = v.object(convergenceCurrentConfigSchemaFields);

