import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Import versioning utilities
const CURRENT_FINGERPRINT_VERSION = '1.0.0';

// Helper to get next version for evolution
function getNextVersion(currentVersion: string, changeType: 'major' | 'minor' | 'patch' = 'patch'): string {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (changeType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

// Basic validation helpers
function validateStringLength(value: string, fieldName: string, maxLength: number): string {
  if (value.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or less`);
  }
  return value.trim();
}

function validateComplexityLevel(level: number): number {
  if (level < 1 || level > 10) {
    throw new Error("Complexity level must be between 1 and 10");
  }
  return level;
}

function validateConfidenceScore(score: number): number {
  if (score < 0 || score > 1) {
    throw new Error("Confidence score must be between 0 and 1");
  }
  return score;
}

// Helper to validate fingerprint ownership
async function validateFingerprintOwnership(ctx: any, fingerprintId: Id<"project_fingerprints">, userId?: string) {
  const fingerprint = await ctx.db.get(fingerprintId);
  
  if (!fingerprint) {
    throw new Error("Fingerprint not found");
  }

  if (userId && fingerprint.userId !== userId) {
    throw new Error("Access denied: You don't own this fingerprint");
  }

  return fingerprint;
}

// Helper to validate project ownership
async function validateProjectOwnership(ctx: any, projectId: Id<"projects">, userId?: string) {
  const project = await ctx.db.get(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  if (userId && project.userId !== userId) {
    throw new Error("Access denied: You don't own this project");
  }

  return project;
}

// Create a new fingerprint
export const createFingerprint = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),

    // AI-Discovered Project Nature
    domain: v.optional(v.string()),
    complexity_level: v.optional(v.number()),
    collaboration_style: v.optional(v.string()),
    time_horizon: v.optional(v.string()),
    primary_pattern: v.optional(v.string()),
    working_style: v.optional(v.array(v.string())),

    // AI-Generated Project Archetype
    decision_making: v.optional(v.string()),
    energy_patterns: v.optional(v.string()),

    // Intentions
    core_intention: v.optional(v.string()),
    success_vision: v.optional(v.string()),
    value_creation: v.optional(v.string()),
    personal_growth: v.optional(v.array(v.string())),

    // Dynamic Timeline
    natural_rhythm: v.optional(v.string()),
    key_phases: v.optional(v.array(v.object({
      name: v.string(),
      essence: v.string(),
      estimated_duration: v.string(),
      readiness_indicators: v.array(v.string()),
    }))),
    flexibility_preference: v.optional(v.string()),

    // Output Desires
    tangible_deliverables: v.optional(v.array(v.string())),
    intangible_benefits: v.optional(v.array(v.string())),
    measurement_approach: v.optional(v.string()),
    sharing_intention: v.optional(v.string()),

    // Interface Preferences
    cognitive_load_preference: v.optional(v.string()),
    information_density: v.optional(v.string()),
    motivation_style: v.optional(v.array(v.string())),
    feedback_frequency: v.optional(v.string()),

    // Evolution Intelligence
    learning_sensitivity: v.optional(v.number()),
    change_triggers: v.optional(v.array(v.object({
      condition_type: v.string(),
      threshold: v.number(),
      response_style: v.string(),
    }))),
    stability_zones: v.optional(v.array(v.string())),
    growth_edges: v.optional(v.array(v.string())),

    // AI Agent Coordination
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

    // AI Prompt Generation
    base_personality: v.optional(v.string()),
    project_voice: v.optional(v.string()),
    question_generation_style: v.optional(v.string()),
    suggestion_approach: v.optional(v.string()),
    clarification_method: v.optional(v.string()),

    // Dynamic Intelligence Fields
    dynamic_dimensions: v.optional(v.array(v.object({
      dimension_name: v.string(),
      dimension_type: v.string(),
      measurement_approach: v.string(),
      evolution_sensitivity: v.number(),
      ui_representation: v.string(),
    }))),

    // Contextual Awareness
    user_constraints: v.optional(v.array(v.string())),
    external_dependencies: v.optional(v.array(v.string())),
    support_systems: v.optional(v.array(v.string())),
    potential_obstacles: v.optional(v.array(v.string())),

    // Status
    status: v.optional(v.string()),
  },
  returns: v.id("project_fingerprints"),
  handler: async (ctx, args) => {
    // Validate inputs
    if (!args.userId || args.userId.trim() === '') {
      throw new Error("Valid user ID is required");
    }

    if (!args.name || args.name.trim() === '') {
      throw new Error("Fingerprint name is required");
    }

    // Validate project ownership
    await validateProjectOwnership(ctx, args.projectId, args.userId);

    // Validate and sanitize inputs
    const sanitizedName = validateStringLength(args.name, "Fingerprint name", 200);
    const sanitizedDescription = args.description ? validateStringLength(args.description, "Fingerprint description", 1000) : undefined;
    
    // Validate complexity level if provided
    const validatedComplexityLevel = args.complexity_level ? validateComplexityLevel(args.complexity_level) : 1;

    const now = Date.now();

    try {
      const fingerprintId = await ctx.db.insert("project_fingerprints", {
        projectId: args.projectId,
        userId: args.userId,
        name: sanitizedName,
        description: sanitizedDescription,

        // AI-Discovered Project Nature
        domain: args.domain || '',
        complexity_level: validatedComplexityLevel,
        collaboration_style: args.collaboration_style || 'solo',
        time_horizon: args.time_horizon || 'project',
        primary_pattern: args.primary_pattern || 'iterative_creator',
        working_style: args.working_style || [],

        // AI-Generated Project Archetype
        decision_making: args.decision_making || '',
        energy_patterns: args.energy_patterns || '',

        // Intentions
        core_intention: args.core_intention || '',
        success_vision: args.success_vision || '',
        value_creation: args.value_creation || '',
        personal_growth: args.personal_growth || [],

        // Dynamic Timeline
        natural_rhythm: args.natural_rhythm || 'daily',
        key_phases: args.key_phases || [],
        flexibility_preference: args.flexibility_preference || 'adaptive',

        // Output Desires
        tangible_deliverables: args.tangible_deliverables || [],
        intangible_benefits: args.intangible_benefits || [],
        measurement_approach: args.measurement_approach || '',
        sharing_intention: args.sharing_intention || 'private',

        // Interface Preferences
        cognitive_load_preference: args.cognitive_load_preference || 'rich',
        information_density: args.information_density || 'contextual',
        motivation_style: args.motivation_style || [],
        feedback_frequency: args.feedback_frequency || 'weekly',

        // Evolution Intelligence
        learning_sensitivity: args.learning_sensitivity || 5,
        change_triggers: args.change_triggers || [],
        stability_zones: args.stability_zones || [],
        growth_edges: args.growth_edges || [],

        // AI Agent Coordination
        morning_persona: args.morning_persona || {
          energy_match: '',
          focus_style: '',
          preparation_depth: '',
        },
        evening_persona: args.evening_persona || {
          reflection_approach: '',
          consolidation_style: '',
          transition_support: '',
        },
        event_triggers: args.event_triggers || [],

        // AI Prompt Generation
        base_personality: args.base_personality || '',
        project_voice: args.project_voice || '',
        question_generation_style: args.question_generation_style || '',
        suggestion_approach: args.suggestion_approach || '',
        clarification_method: args.clarification_method || '',

        // Dynamic Intelligence Fields
        dynamic_dimensions: args.dynamic_dimensions || [],

        // Contextual Awareness
        user_constraints: args.user_constraints || [],
        external_dependencies: args.external_dependencies || [],
        support_systems: args.support_systems || [],
        potential_obstacles: args.potential_obstacles || [],

        // Metadata
        created_at: now,
        last_evolution: now,
        intelligence_version: CURRENT_FINGERPRINT_VERSION,
        status: args.status || 'discovering',
      });

      return fingerprintId;
    } catch (error) {
      console.error("Failed to create fingerprint:", error);
      throw new Error("Failed to create fingerprint. Please try again.");
    }
  },
});

// Update a fingerprint
export const updateFingerprint = mutation({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    userId: v.optional(v.string()), // For ownership validation

    // Core fields
    name: v.optional(v.string()),
    description: v.optional(v.string()),

    // AI-Discovered Project Nature
    domain: v.optional(v.string()),
    complexity_level: v.optional(v.number()),
    collaboration_style: v.optional(v.string()),
    time_horizon: v.optional(v.string()),
    primary_pattern: v.optional(v.string()),
    working_style: v.optional(v.array(v.string())),

    // AI-Generated Project Archetype
    decision_making: v.optional(v.string()),
    energy_patterns: v.optional(v.string()),

    // Intentions
    core_intention: v.optional(v.string()),
    success_vision: v.optional(v.string()),
    value_creation: v.optional(v.string()),
    personal_growth: v.optional(v.array(v.string())),

    // Dynamic Timeline
    natural_rhythm: v.optional(v.string()),
    key_phases: v.optional(v.array(v.object({
      name: v.string(),
      essence: v.string(),
      estimated_duration: v.string(),
      readiness_indicators: v.array(v.string()),
    }))),
    flexibility_preference: v.optional(v.string()),

    // Output Desires
    tangible_deliverables: v.optional(v.array(v.string())),
    intangible_benefits: v.optional(v.array(v.string())),
    measurement_approach: v.optional(v.string()),
    sharing_intention: v.optional(v.string()),

    // Interface Preferences
    cognitive_load_preference: v.optional(v.string()),
    information_density: v.optional(v.string()),
    motivation_style: v.optional(v.array(v.string())),
    feedback_frequency: v.optional(v.string()),

    // Evolution Intelligence
    learning_sensitivity: v.optional(v.number()),
    change_triggers: v.optional(v.array(v.object({
      condition_type: v.string(),
      threshold: v.number(),
      response_style: v.string(),
    }))),
    stability_zones: v.optional(v.array(v.string())),
    growth_edges: v.optional(v.array(v.string())),

    // AI Agent Coordination
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

    // AI Prompt Generation
    base_personality: v.optional(v.string()),
    project_voice: v.optional(v.string()),
    question_generation_style: v.optional(v.string()),
    suggestion_approach: v.optional(v.string()),
    clarification_method: v.optional(v.string()),

    // Dynamic Intelligence Fields
    dynamic_dimensions: v.optional(v.array(v.object({
      dimension_name: v.string(),
      dimension_type: v.string(),
      measurement_approach: v.string(),
      evolution_sensitivity: v.number(),
      ui_representation: v.string(),
    }))),

    // Contextual Awareness
    user_constraints: v.optional(v.array(v.string())),
    external_dependencies: v.optional(v.array(v.string())),
    support_systems: v.optional(v.array(v.string())),
    potential_obstacles: v.optional(v.array(v.string())),

    // Status
    status: v.optional(v.string()),
  },
  returns: v.id("project_fingerprints"),
  handler: async (ctx, args) => {
    // Validate fingerprint ownership
    const fingerprint = await validateFingerprintOwnership(ctx, args.fingerprintId, args.userId);

    const updates: any = {
      updatedAt: Date.now(),
    };

    // Validate and sanitize core fields
    if (args.name !== undefined) {
      const sanitizedName = args.name.trim();
      if (sanitizedName === '') {
        throw new Error("Fingerprint name cannot be empty");
      }
      if (sanitizedName.length > 200) {
        throw new Error("Fingerprint name must be 200 characters or less");
      }
      updates.name = sanitizedName;
    }

    if (args.description !== undefined) {
      const sanitizedDescription = args.description.trim();
      if (sanitizedDescription.length > 1000) {
        throw new Error("Fingerprint description must be 1000 characters or less");
      }
      updates.description = sanitizedDescription || undefined;
    }

    // Update optional fields if provided
    if (args.domain !== undefined) updates.domain = args.domain;
    if (args.complexity_level !== undefined) updates.complexity_level = args.complexity_level;
    if (args.collaboration_style !== undefined) updates.collaboration_style = args.collaboration_style;
    if (args.time_horizon !== undefined) updates.time_horizon = args.time_horizon;
    if (args.primary_pattern !== undefined) updates.primary_pattern = args.primary_pattern;
    if (args.working_style !== undefined) updates.working_style = args.working_style;

    // Update fields that exist in schema
    if (args.status !== undefined) updates.status = args.status;

    // AI-Discovered Project Nature
    if (args.domain !== undefined) updates.domain = args.domain;
    if (args.complexity_level !== undefined) updates.complexity_level = args.complexity_level;
    if (args.collaboration_style !== undefined) updates.collaboration_style = args.collaboration_style;
    if (args.time_horizon !== undefined) updates.time_horizon = args.time_horizon;
    if (args.primary_pattern !== undefined) updates.primary_pattern = args.primary_pattern;
    if (args.working_style !== undefined) updates.working_style = args.working_style;

    // AI-Generated Project Archetype
    if (args.decision_making !== undefined) updates.decision_making = args.decision_making;
    if (args.energy_patterns !== undefined) updates.energy_patterns = args.energy_patterns;

    // Intentions
    if (args.core_intention !== undefined) updates.core_intention = args.core_intention;
    if (args.success_vision !== undefined) updates.success_vision = args.success_vision;
    if (args.value_creation !== undefined) updates.value_creation = args.value_creation;
    if (args.personal_growth !== undefined) updates.personal_growth = args.personal_growth;

    // Dynamic Timeline
    if (args.natural_rhythm !== undefined) updates.natural_rhythm = args.natural_rhythm;
    if (args.key_phases !== undefined) updates.key_phases = args.key_phases;
    if (args.flexibility_preference !== undefined) updates.flexibility_preference = args.flexibility_preference;

    // Output Desires
    if (args.tangible_deliverables !== undefined) updates.tangible_deliverables = args.tangible_deliverables;
    if (args.intangible_benefits !== undefined) updates.intangible_benefits = args.intangible_benefits;
    if (args.measurement_approach !== undefined) updates.measurement_approach = args.measurement_approach;
    if (args.sharing_intention !== undefined) updates.sharing_intention = args.sharing_intention;

    // Interface Preferences
    if (args.cognitive_load_preference !== undefined) updates.cognitive_load_preference = args.cognitive_load_preference;
    if (args.information_density !== undefined) updates.information_density = args.information_density;
    if (args.motivation_style !== undefined) updates.motivation_style = args.motivation_style;
    if (args.feedback_frequency !== undefined) updates.feedback_frequency = args.feedback_frequency;

    // Evolution Intelligence
    if (args.learning_sensitivity !== undefined) updates.learning_sensitivity = args.learning_sensitivity;
    if (args.change_triggers !== undefined) updates.change_triggers = args.change_triggers;
    if (args.stability_zones !== undefined) updates.stability_zones = args.stability_zones;
    if (args.growth_edges !== undefined) updates.growth_edges = args.growth_edges;

    // AI Agent Coordination
    if (args.morning_persona !== undefined) updates.morning_persona = args.morning_persona;
    if (args.evening_persona !== undefined) updates.evening_persona = args.evening_persona;
    if (args.event_triggers !== undefined) updates.event_triggers = args.event_triggers;

    // AI Prompt Generation
    if (args.base_personality !== undefined) updates.base_personality = args.base_personality;
    if (args.project_voice !== undefined) updates.project_voice = args.project_voice;
    if (args.question_generation_style !== undefined) updates.question_generation_style = args.question_generation_style;
    if (args.suggestion_approach !== undefined) updates.suggestion_approach = args.suggestion_approach;
    if (args.clarification_method !== undefined) updates.clarification_method = args.clarification_method;

    // Dynamic Intelligence Fields
    if (args.dynamic_dimensions !== undefined) updates.dynamic_dimensions = args.dynamic_dimensions;

    // Contextual Awareness
    if (args.user_constraints !== undefined) updates.user_constraints = args.user_constraints;
    if (args.external_dependencies !== undefined) updates.external_dependencies = args.external_dependencies;
    if (args.support_systems !== undefined) updates.support_systems = args.support_systems;
    if (args.potential_obstacles !== undefined) updates.potential_obstacles = args.potential_obstacles;

    try {
      updates.last_evolution = Date.now(); // Update last evolution timestamp
      
      // Update intelligence version if significant changes were made
      const hasSignificantChanges = Object.keys(updates).some(key => 
        ['core_intention', 'success_vision', 'domain', 'complexity_level', 'primary_pattern'].includes(key)
      );
      
      if (hasSignificantChanges && fingerprint.intelligence_version) {
        updates.intelligence_version = getNextVersion(fingerprint.intelligence_version, 'minor');
      }
      
      await ctx.db.patch(args.fingerprintId, updates);
      return args.fingerprintId;
    } catch (error) {
      console.error("Failed to update fingerprint:", error);
      throw new Error("Failed to update fingerprint. Please try again.");
    }
  },
});

// Delete a fingerprint
export const deleteFingerprint = mutation({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    userId: v.optional(v.string()), // For ownership validation
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Validate fingerprint ownership
    await validateFingerprintOwnership(ctx, args.fingerprintId, args.userId);

    try {
      await ctx.db.delete(args.fingerprintId);
      return true;
    } catch (error) {
      console.error("Failed to delete fingerprint:", error);
      throw new Error("Failed to delete fingerprint. Please try again.");
    }
  },
});

// Link fingerprint to project
export const linkFingerprintToProject = mutation({
  args: {
    projectId: v.id("projects"),
    fingerprintId: v.id("project_fingerprints"),
    userId: v.optional(v.string()), // For ownership validation
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    // Validate both project and fingerprint ownership
    await validateProjectOwnership(ctx, args.projectId, args.userId);
    await validateFingerprintOwnership(ctx, args.fingerprintId, args.userId);

    try {
      await ctx.db.patch(args.projectId, {
        fingerprintId: args.fingerprintId,
        updatedAt: Date.now(),
      });
      return args.projectId;
    } catch (error) {
      console.error("Failed to link fingerprint to project:", error);
      throw new Error("Failed to link fingerprint to project. Please try again.");
    }
  },
});

// Unlink fingerprint from project
export const unlinkFingerprintFromProject = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.string()), // For ownership validation
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    // Validate project ownership
    await validateProjectOwnership(ctx, args.projectId, args.userId);

    try {
      await ctx.db.patch(args.projectId, {
        fingerprintId: undefined,
        updatedAt: Date.now(),
      });
      return args.projectId;
    } catch (error) {
      console.error("Failed to unlink fingerprint from project:", error);
      throw new Error("Failed to unlink fingerprint from project. Please try again.");
    }
  },
});

// Update fingerprint evolution metadata
export const updateFingerprintEvolution = mutation({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    userId: v.optional(v.string()), // For ownership validation
    intelligence_version: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  returns: v.id("project_fingerprints"),
  handler: async (ctx, args) => {
    // Validate fingerprint ownership
    await validateFingerprintOwnership(ctx, args.fingerprintId, args.userId);

    const updates: any = {};

    // Update evolution metadata
    if (args.intelligence_version !== undefined) updates.intelligence_version = args.intelligence_version;
    if (args.status !== undefined) updates.status = args.status;

    if (Object.keys(updates).length > 0) {
      updates.last_evolution = Date.now();
      try {
        await ctx.db.patch(args.fingerprintId, updates);
        return args.fingerprintId;
      } catch (error) {
        console.error("Failed to update fingerprint evolution:", error);
        throw new Error("Failed to update fingerprint evolution. Please try again.");
      }
    }

    return args.fingerprintId;
  },
});
