import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Create a new project fingerprint from AI-generated data
 */
export const createFingerprint = mutation({
  args: {
    // Core Identity
    projectId: v.id("projects"),
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),

    // AI-Discovered Project Nature
    domain: v.string(),
    complexity_level: v.number(),
    collaboration_style: v.string(),
    time_horizon: v.string(),

    // AI-Generated Project Archetype
    primary_pattern: v.string(),
    working_style: v.array(v.string()),
    decision_making: v.string(),
    energy_patterns: v.string(),

    // Intentions
    core_intention: v.string(),
    success_vision: v.string(),
    value_creation: v.string(),
    personal_growth: v.array(v.string()),

    // Dynamic Timeline
    natural_rhythm: v.string(),
    key_phases: v.array(v.object({
      name: v.string(),
      essence: v.string(),
      estimated_duration: v.string(),
      readiness_indicators: v.array(v.string()),
    })),
    flexibility_preference: v.string(),

    // Output Desires
    tangible_deliverables: v.array(v.string()),
    intangible_benefits: v.array(v.string()),
    measurement_approach: v.string(),
    sharing_intention: v.string(),

    // Interface Preferences
    cognitive_load_preference: v.string(),
    information_density: v.string(),
    motivation_style: v.array(v.string()),
    feedback_frequency: v.string(),

    // Evolution Intelligence
    learning_sensitivity: v.number(),
    change_triggers: v.array(v.object({
      condition_type: v.string(),
      threshold: v.number(),
      response_style: v.string(),
    })),
    stability_zones: v.array(v.string()),
    growth_edges: v.array(v.string()),

    // AI Agent Coordination
    morning_persona: v.object({
      energy_match: v.string(),
      focus_style: v.string(),
      preparation_depth: v.string(),
    }),
    evening_persona: v.object({
      reflection_approach: v.string(),
      consolidation_style: v.string(),
      transition_support: v.string(),
    }),
    event_triggers: v.array(v.object({
      trigger_pattern: v.string(),
      response_personality: v.string(),
      coordination_rules: v.array(v.string()),
    })),

    // AI Prompt Generation
    base_personality: v.string(),
    project_voice: v.string(),
    question_generation_style: v.string(),
    suggestion_approach: v.string(),
    clarification_method: v.string(),

    // Dynamic Intelligence Fields
    dynamic_dimensions: v.array(v.object({
      dimension_name: v.string(),
      dimension_type: v.string(),
      measurement_approach: v.string(),
      evolution_sensitivity: v.number(),
      ui_representation: v.string(),
    })),

    // Contextual Awareness
    user_constraints: v.array(v.string()),
    external_dependencies: v.array(v.string()),
    support_systems: v.array(v.string()),
    potential_obstacles: v.array(v.string()),

    // Metadata
    intelligence_version: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Create the fingerprint
    const fingerprintId = await ctx.db.insert("project_fingerprints", {
      // Core Identity
      projectId: args.projectId,
      userId: args.userId,
      name: args.name,
      description: args.description,

      // AI-Discovered Project Nature
      domain: args.domain,
      complexity_level: args.complexity_level,
      collaboration_style: args.collaboration_style,
      time_horizon: args.time_horizon,

      // AI-Generated Project Archetype
      primary_pattern: args.primary_pattern,
      working_style: args.working_style,
      decision_making: args.decision_making,
      energy_patterns: args.energy_patterns,

      // Intentions
      core_intention: args.core_intention,
      success_vision: args.success_vision,
      value_creation: args.value_creation,
      personal_growth: args.personal_growth,

      // Dynamic Timeline
      natural_rhythm: args.natural_rhythm,
      key_phases: args.key_phases,
      flexibility_preference: args.flexibility_preference,

      // Output Desires
      tangible_deliverables: args.tangible_deliverables,
      intangible_benefits: args.intangible_benefits,
      measurement_approach: args.measurement_approach,
      sharing_intention: args.sharing_intention,

      // Interface Preferences
      cognitive_load_preference: args.cognitive_load_preference,
      information_density: args.information_density,
      motivation_style: args.motivation_style,
      feedback_frequency: args.feedback_frequency,

      // Evolution Intelligence
      learning_sensitivity: args.learning_sensitivity,
      change_triggers: args.change_triggers,
      stability_zones: args.stability_zones,
      growth_edges: args.growth_edges,

      // AI Agent Coordination
      morning_persona: args.morning_persona,
      evening_persona: args.evening_persona,
      event_triggers: args.event_triggers,

      // AI Prompt Generation
      base_personality: args.base_personality,
      project_voice: args.project_voice,
      question_generation_style: args.question_generation_style,
      suggestion_approach: args.suggestion_approach,
      clarification_method: args.clarification_method,

      // Dynamic Intelligence Fields
      dynamic_dimensions: args.dynamic_dimensions,

      // Contextual Awareness
      user_constraints: args.user_constraints,
      external_dependencies: args.external_dependencies,
      support_systems: args.support_systems,
      potential_obstacles: args.potential_obstacles,

      // Metadata
      created_at: now,
      last_evolution: now,
      intelligence_version: args.intelligence_version || "1.0.0",
      status: args.status || "active",
    });

    // Update the project to link it to the fingerprint
    await ctx.db.patch(args.projectId, {
      fingerprintId: fingerprintId,
      updatedAt: now,
    });

    return fingerprintId;
  },
});

/**
 * Update an existing project fingerprint
 */
export const updateFingerprint = mutation({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),
    updates: v.object({
      // Allow updating most fields
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      domain: v.optional(v.string()),
      complexity_level: v.optional(v.number()),
      collaboration_style: v.optional(v.string()),
      time_horizon: v.optional(v.string()),
      primary_pattern: v.optional(v.string()),
      working_style: v.optional(v.array(v.string())),
      decision_making: v.optional(v.string()),
      energy_patterns: v.optional(v.string()),
      core_intention: v.optional(v.string()),
      success_vision: v.optional(v.string()),
      value_creation: v.optional(v.string()),
      personal_growth: v.optional(v.array(v.string())),
      natural_rhythm: v.optional(v.string()),
      key_phases: v.optional(v.array(v.object({
        name: v.string(),
        essence: v.string(),
        estimated_duration: v.string(),
        readiness_indicators: v.array(v.string()),
      }))),
      flexibility_preference: v.optional(v.string()),
      tangible_deliverables: v.optional(v.array(v.string())),
      intangible_benefits: v.optional(v.array(v.string())),
      measurement_approach: v.optional(v.string()),
      sharing_intention: v.optional(v.string()),
      cognitive_load_preference: v.optional(v.string()),
      information_density: v.optional(v.string()),
      motivation_style: v.optional(v.array(v.string())),
      feedback_frequency: v.optional(v.string()),
      learning_sensitivity: v.optional(v.number()),
      change_triggers: v.optional(v.array(v.object({
        condition_type: v.string(),
        threshold: v.number(),
        response_style: v.string(),
      }))),
      stability_zones: v.optional(v.array(v.string())),
      growth_edges: v.optional(v.array(v.string())),
      morning_persona: v.optional(v.object({
        energy_match: v.string(),
        focus_style: v.string(),
        preparation_depth: v.string(),
      })),
      evening_persona: v.optional(v.object({
        reflection_approach: v.string(),
        consolidation_style: v.string(),
        transition_support: v.string(),
      })),
      event_triggers: v.optional(v.array(v.object({
        trigger_pattern: v.string(),
        response_personality: v.string(),
        coordination_rules: v.array(v.string()),
      }))),
      base_personality: v.optional(v.string()),
      project_voice: v.optional(v.string()),
      question_generation_style: v.optional(v.string()),
      suggestion_approach: v.optional(v.string()),
      clarification_method: v.optional(v.string()),
      dynamic_dimensions: v.optional(v.array(v.object({
        dimension_name: v.string(),
        dimension_type: v.string(),
        measurement_approach: v.string(),
        evolution_sensitivity: v.number(),
        ui_representation: v.string(),
      }))),
      user_constraints: v.optional(v.array(v.string())),
      external_dependencies: v.optional(v.array(v.string())),
      support_systems: v.optional(v.array(v.string())),
      potential_obstacles: v.optional(v.array(v.string())),
      intelligence_version: v.optional(v.string()),
      status: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // Verify the fingerprint belongs to the user
    const fingerprint = await ctx.db.get(args.fingerprintId);
    if (!fingerprint) {
      throw new Error("Fingerprint not found");
    }
    
    if (fingerprint.userId !== args.userId) {
      throw new Error("Unauthorized: Fingerprint does not belong to user");
    }

    // Update the fingerprint
    await ctx.db.patch(args.fingerprintId, {
      ...args.updates,
      last_evolution: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a project fingerprint
 */
export const deleteFingerprint = mutation({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify the fingerprint belongs to the user
    const fingerprint = await ctx.db.get(args.fingerprintId);
    if (!fingerprint) {
      throw new Error("Fingerprint not found");
    }
    
    if (fingerprint.userId !== args.userId) {
      throw new Error("Unauthorized: Fingerprint does not belong to user");
    }

    // Remove the fingerprint reference from the project
    await ctx.db.patch(fingerprint.projectId, {
      fingerprintId: undefined,
      updatedAt: Date.now(),
    });

    // Delete the fingerprint
    await ctx.db.delete(args.fingerprintId);

    return { success: true };
  },
});
