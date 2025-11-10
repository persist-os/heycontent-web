/**
 * Convergence Storage Type Definitions
 * 
 * CRITICAL: These types MUST match backend/app/models/convergence_storage.py exactly
 * Any changes here should be mirrored in Python and vice versa.
 */

import { v } from "convex/values";

// ============================================================================
// OPTIMIZATION EXPERIMENT TYPES
// ============================================================================

// Schema fields (unwrapped for defineTable)
export const optimizationExperimentSchemaFields = {
  experiment_id: v.string(),
  optimization_run_id: v.string(),
  system_name: v.string(),
  algorithm_name: v.string(),
  test_case_id: v.string(),
  tested_config: v.any(),
  generation_number: v.optional(v.number()),
  experiment_score: v.number(),
  test_passed: v.boolean(),
  latency_ms: v.optional(v.number()),
  cost_usd: v.optional(v.number()),
  full_metrics: v.optional(v.any()),
  session_id: v.optional(v.string()),
  experiment_timestamp: v.number(),
  createdAt: v.number(),
};

export const optimizationExperimentValidator = v.object({
  experiment_id: v.string(),
  optimization_run_id: v.string(),
  system_name: v.string(),
  algorithm_name: v.string(),
  test_case_id: v.string(),
  tested_config: v.any(),
  generation_number: v.optional(v.number()),
  experiment_score: v.number(),
  test_passed: v.boolean(),
  latency_ms: v.optional(v.number()),
  cost_usd: v.optional(v.number()),
  full_metrics: v.optional(v.any()),
  session_id: v.optional(v.string()),
  experiment_timestamp: v.number(),
});

export const optimizationExperimentReturnValidator = v.object({
  _id: v.id("convergence_optimization_experiments"),
  _creationTime: v.number(),
  experiment_id: v.string(),
  optimization_run_id: v.string(),
  system_name: v.string(),
  algorithm_name: v.string(),
  test_case_id: v.string(),
  tested_config: v.any(),
  generation_number: v.optional(v.number()),
  experiment_score: v.number(),
  test_passed: v.boolean(),
  latency_ms: v.optional(v.number()),
  cost_usd: v.optional(v.number()),
  full_metrics: v.optional(v.any()),
  session_id: v.optional(v.string()),
  experiment_timestamp: v.number(),
  createdAt: v.number(),
});

// ============================================================================
// OPTIMIZATION RUN TYPES
// ============================================================================

// Schema fields (unwrapped for defineTable)
export const optimizationRunSchemaFields = {
  run_id: v.string(),
  system_name: v.string(),
  algorithm_name: v.string(),
  run_started_at: v.number(),
  run_completed_at: v.optional(v.number()),
  total_duration_ms: v.optional(v.number()),
  total_experiments_run: v.number(),
  best_experiment_score: v.number(),
  avg_experiment_score: v.number(),
  experiments_by_generation: v.optional(v.any()),
  winning_config_snapshot: v.optional(v.any()),
  total_generations: v.optional(v.number()),
  convergence_achieved: v.optional(v.boolean()),
  createdAt: v.number(),
};

export const optimizationRunValidator = v.object({
  run_id: v.string(),
  system_name: v.string(),
  algorithm_name: v.string(),
  run_started_at: v.number(),
  run_completed_at: v.optional(v.number()),
  total_duration_ms: v.optional(v.number()),
  total_experiments_run: v.number(),
  best_experiment_score: v.number(),
  avg_experiment_score: v.number(),
  experiments_by_generation: v.optional(v.any()),
  winning_config_snapshot: v.optional(v.any()),
  total_generations: v.optional(v.number()),
  convergence_achieved: v.optional(v.boolean()),
});

export const optimizationRunReturnValidator = v.object({
  _id: v.id("convergence_optimization_runs"),
  _creationTime: v.number(),
  run_id: v.string(),
  system_name: v.string(),
  algorithm_name: v.string(),
  run_started_at: v.number(),
  run_completed_at: v.optional(v.number()),
  total_duration_ms: v.optional(v.number()),
  total_experiments_run: v.number(),
  best_experiment_score: v.number(),
  avg_experiment_score: v.number(),
  experiments_by_generation: v.optional(v.any()),
  winning_config_snapshot: v.optional(v.any()),
  total_generations: v.optional(v.number()),
  convergence_achieved: v.optional(v.boolean()),
  createdAt: v.number(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export interface OptimizationExperiment {
  experiment_id: string;
  optimization_run_id: string;
  system_name: string;
  algorithm_name: string;
  test_case_id: string;
  tested_config: any;
  generation_number?: number;
  experiment_score: number;
  test_passed: boolean;
  latency_ms?: number;
  cost_usd?: number;
  full_metrics?: any;
  session_id?: string;
  experiment_timestamp: number;
}

export interface OptimizationRun {
  run_id: string;
  system_name: string;
  algorithm_name: string;
  run_started_at: number;
  run_completed_at?: number;
  total_duration_ms?: number;
  total_experiments_run: number;
  best_experiment_score: number;
  avg_experiment_score: number;
  experiments_by_generation?: any;
  winning_config_snapshot?: any;
  total_generations?: number;
  convergence_achieved?: boolean;
}

