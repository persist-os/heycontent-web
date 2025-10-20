/**
 * Convergence Type Definitions
 * 
 * CRITICAL: These types MUST match backend/app/models/convergence.py exactly
 * Any changes here should be mirrored in Python and vice versa.
 */

import { v } from "convex/values";

// Config type validator - flexible string
export const configTypeValidator = v.string();

// Config status validator - flexible string  
export const configStatusValidator = v.string();

// Config metrics validator - flexible any
export const configMetricsValidator = v.optional(v.any());

// Complete config validator for mutations
export const convergenceConfigValidator = v.object({
  system_name: v.string(),
  config_type: configTypeValidator,
  params: v.any(),
  score: v.number(),
  rank: v.number(),
  test_cases_passed: v.number(),
  test_cases_total: v.number(),
  optimization_run_id: v.string(),
  algorithm_used: v.string(),
  version: v.string(),
  generation: v.optional(v.number()),
  metrics: configMetricsValidator,
  status: v.optional(configStatusValidator),
  replaces_config_id: v.optional(v.string()),
});

// Type exports for TypeScript code
export type ConfigType = "mab_params" | "tool_workflow" | "agent_config" | "feature_params";
export type ConfigStatus = "candidate" | "active" | "archived";

export interface ConfigMetrics {
  latency_ms?: number;
  accuracy?: number;
  relevance?: number;
  custom_metrics?: any;
}

export interface ConvergenceConfig {
  system_name: string;
  config_type: ConfigType;
  params: any;
  score: number;
  rank: number;
  test_cases_passed: number;
  test_cases_total: number;
  optimization_run_id: string;
  algorithm_used: string;
  version: string;
  generation?: number;
  metrics?: ConfigMetrics;
  status?: ConfigStatus;
  replaces_config_id?: string;
}

// Response types for API calls
export interface ConvergenceConfigResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface BatchSaveResult {
  success: boolean;
  config_ids: string[];
  count: number;
}

export interface PromoteResult {
  archived_count: number;
  promoted_count: number;
}

export interface SystemStats {
  total_configs: number;
  active_configs: number;
  candidate_configs: number;
  archived_configs: number;
  best_score: number;
  avg_score: number;
  total_usage: number;
  avg_success_rate: number;
  last_updated: number;
  last_deployed: number | null;
}

