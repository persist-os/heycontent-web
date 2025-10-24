/**
 * Project Fingerprint Type Definitions
 * 
 * Universal AI project intelligence - captures project nature, user patterns,
 * and AI coordination preferences.
 */

import { v } from "convex/values";

// Schema fields (unwrapped for defineTable)
export const projectFingerprintSchemaFields = {
  // Core Identity
  projectId: v.id("projects"),
  userId: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  discoveryConversationId: v.optional(v.id("conversations")),

  // AI-Discovered Project Nature (flattened for AI searchability)
  domain: v.optional(v.any()),
  complexity_level: v.optional(v.number()),
  collaboration_style: v.optional(v.any()),
  time_horizon: v.optional(v.any()),

  // AI-Generated Project Archetype (flattened)
  primary_pattern: v.optional(v.any()),
  working_style: v.optional(v.any()),
  decision_making: v.optional(v.any()),
  energy_patterns: v.optional(v.any()),

  // Intentions (User + AI refined)
  core_intention: v.optional(v.any()),
  success_vision: v.optional(v.any()),
  value_creation: v.optional(v.any()),
  personal_growth: v.optional(v.any()),

  // Dynamic Timeline (AI suggests, user refines)
  natural_rhythm: v.optional(v.any()),
  key_phases: v.optional(v.any()),
  flexibility_preference: v.optional(v.any()),

  // Output Desires (AI helps articulate)
  tangible_deliverables: v.optional(v.any()),
  intangible_benefits: v.optional(v.any()),
  measurement_approach: v.optional(v.any()),
  sharing_intention: v.optional(v.any()),

  // Interface Preferences (AI learns from behavior)
  cognitive_load_preference: v.optional(v.any()),
  information_density: v.optional(v.any()),
  motivation_style: v.optional(v.any()),
  feedback_frequency: v.optional(v.any()),

  // Evolution Intelligence
  learning_sensitivity: v.optional(v.number()),
  change_triggers: v.optional(v.any()),
  stability_zones: v.optional(v.any()),
  growth_edges: v.optional(v.any()),

  // AI Agent Coordination
  morning_persona: v.optional(v.any()),
  evening_persona: v.optional(v.any()),
  event_triggers: v.optional(v.any()),

  // AI Prompt Generation
  base_personality: v.optional(v.any()),
  project_voice: v.optional(v.any()),
  question_generation_style: v.optional(v.any()),
  suggestion_approach: v.optional(v.any()),
  clarification_method: v.optional(v.any()),

  // Dynamic Intelligence Fields (AI-generated based on project)
  dynamic_dimensions: v.optional(v.any()),

  // Contextual Awareness
  user_constraints: v.optional(v.any()),
  external_dependencies: v.optional(v.any()),
  support_systems: v.optional(v.any()),
  potential_obstacles: v.optional(v.any()),

  // Metadata
  created_at: v.number(),
  last_evolution: v.optional(v.number()),
  intelligence_version: v.optional(v.string()),
  status: v.optional(v.string()),
};

// Wrapped validator for mutations/queries
export const projectFingerprintValidator = v.object(projectFingerprintSchemaFields);

// Type exports
export interface ProjectFingerprint {
  projectId: string;
  userId: string;
  name: string;
  description?: string;
  discoveryConversationId?: string;
  domain?: any;
  complexity_level?: number;
  collaboration_style?: any;
  time_horizon?: any;
  primary_pattern?: any;
  working_style?: any;
  decision_making?: any;
  energy_patterns?: any;
  core_intention?: any;
  success_vision?: any;
  value_creation?: any;
  personal_growth?: any;
  natural_rhythm?: any;
  key_phases?: any;
  flexibility_preference?: any;
  tangible_deliverables?: any;
  intangible_benefits?: any;
  measurement_approach?: any;
  sharing_intention?: any;
  cognitive_load_preference?: any;
  information_density?: any;
  motivation_style?: any;
  feedback_frequency?: any;
  learning_sensitivity?: number;
  change_triggers?: any;
  stability_zones?: any;
  growth_edges?: any;
  morning_persona?: any;
  evening_persona?: any;
  event_triggers?: any;
  base_personality?: any;
  project_voice?: any;
  question_generation_style?: any;
  suggestion_approach?: any;
  clarification_method?: any;
  dynamic_dimensions?: any;
  user_constraints?: any;
  external_dependencies?: any;
  support_systems?: any;
  potential_obstacles?: any;
  created_at: number;
  last_evolution?: number;
  intelligence_version?: string;
  status?: string;
}

