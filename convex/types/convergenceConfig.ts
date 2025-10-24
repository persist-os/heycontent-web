import { v } from "convex/values";

export const convergenceConfigSchemaFields = {
  // System identification
  system_name: v.string(),  // "context_enrichment", "crystal_thresholds_evolution", "reddit_tools"
  config_type: v.string(),  // Flexible string instead of union
  
  // Configuration data
  params: v.any(),  // The actual configuration (flexible structure)
  
  // Vector search (optional - for context-based retrieval)
  contextTag: v.optional(v.string()),        // Hybrid context tag (deterministic + semantic)
  embedding: v.optional(v.array(v.number())), // Vector embedding for similarity search
  
  // Performance metrics
  score: v.number(),              // Overall performance score (0-1)
  rank: v.number(),               // Rank among configs for this system (1 = best)
  test_cases_passed: v.number(),  // Number of test cases passed
  test_cases_total: v.number(),   // Total test cases evaluated
  
  // Convergence metadata
  optimization_run_id: v.string(),    // Links to Convergence run
  algorithm_used: v.string(),         // "mab_evolution", "grid_search", etc.
  generation: v.optional(v.number()), // Generation number if evolutionary
  
  // Evaluation breakdown
  metrics: v.optional(v.any()),  // Flexible metrics object
  
  // Deployment tracking
  status: v.string(),  // Flexible string instead of union
  deployed_at: v.optional(v.number()),
  archived_at: v.optional(v.number()),
  promotion_id: v.optional(v.string()),     // Idempotency key for config promotion
  
  // Usage tracking
  usage_count: v.optional(v.number()),      // Times this config was used
  success_rate: v.optional(v.number()),     // Success rate in production
  last_used: v.optional(v.number()),
  
  // Version control
  version: v.string(),                      // Config version (for rollback)
  replaces_config_id: v.optional(v.string()), // Previous config it replaces
  
  // RL tracking
  rl_episodes: v.optional(v.number()),      // Episodes recorded for RL
  rl_reward_sum: v.optional(v.number()),    // Accumulated reward scores
  rl_last_update: v.optional(v.number()),   // Timestamp of last RL update
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const convergenceConfigValidator = v.object(convergenceConfigSchemaFields);

