/**
 * Convergence Best Config Type Definitions
 * 
 * Stores one best config per system type, updated when better configs are found.
 */

import { v } from "convex/values";

// Schema fields (unwrapped for defineTable)
export const convergenceBestConfigSchemaFields = {
  system_name: v.string(),
  config_params: v.any(), // The actual configuration parameters
  score: v.number(), // Performance score
  optimization_run_id: v.string(), // Which run produced this config
  created_at: v.number(),
  updated_at: v.number(),
};

export const convergenceBestConfigValidator = v.object({
  system_name: v.string(),
  config_params: v.any(),
  score: v.number(),
  optimization_run_id: v.string(),
  created_at: v.number(),
  updated_at: v.number(),
});

export const convergenceBestConfigReturnValidator = v.object({
  _id: v.id("convergence_best_configs"),
  _creationTime: v.number(),
  system_name: v.string(),
  config_params: v.any(),
  score: v.number(),
  optimization_run_id: v.string(),
  created_at: v.number(),
  updated_at: v.number(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export interface ConvergenceBestConfig {
  _id?: string;
  _creationTime?: number;
  system_name: string;
  config_params: any;
  score: number;
  optimization_run_id: string;
  created_at: number;
  updated_at: number;
}
