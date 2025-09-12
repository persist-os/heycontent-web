import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper to safely fetch and validate item existence
async function safeGet<T>(ctx: any, id: string, table: string): Promise<T | null> {
  try {
    return await ctx.db.get(id as Id<any>);
  } catch (error) {
    console.warn(`Failed to fetch ${table} item ${id}:`, error);
    return null;
  }
}

// Get fingerprint by ID
export const getFingerprintById = query({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    userId: v.optional(v.string()), // For ownership validation
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("project_fingerprints"),
      _creationTime: v.number(),
      projectId: v.id("projects"),
      userId: v.string(),
      name: v.string(),
      description: v.optional(v.string()),

      // AI-Discovered Project Nature
      domain: v.string(),
      complexity_level: v.number(),
      collaboration_style: v.string(),
      time_horizon: v.string(),
      primary_pattern: v.string(),
      working_style: v.array(v.string()),

      // AI-Generated Project Archetype
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
      created_at: v.number(),
      last_evolution: v.number(),
      intelligence_version: v.string(),
      status: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const fingerprint = await ctx.db.get(args.fingerprintId);
      if (!fingerprint) {
        return null;
      }

      // Optional: Validate ownership if userId is provided
      if (args.userId && fingerprint.userId !== args.userId) {
        throw new Error("Access denied: You don't own this fingerprint");
      }

      return fingerprint;
    } catch (error) {
      console.error("Failed to fetch fingerprint:", error);
      if (error.message.includes("Access denied")) {
        throw error;
      }
      throw new Error("Failed to fetch fingerprint. Please try again.");
    }
  },
});

// Get fingerprints for a user
export const getFingerprintsForUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("project_fingerprints"),
    _creationTime: v.number(),
    projectId: v.id("projects"),
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),

    // AI-Discovered Project Nature
    domain: v.string(),
    complexity_level: v.number(),
    collaboration_style: v.string(),
    time_horizon: v.string(),
    primary_pattern: v.string(),

    // Intentions summary
    core_intention: v.string(),

    // Timeline summary
    natural_rhythm: v.string(),
    flexibility_preference: v.string(),

    // Metadata
    created_at: v.number(),
    last_evolution: v.number(),
    intelligence_version: v.string(),
    status: v.string(),
  })),
  handler: async (ctx, args) => {
    // Validate user ID
    if (!args.userId || args.userId.trim() === '') {
      throw new Error("Valid user ID is required");
    }

    try {
      const limit = args.limit || 50;
      const fingerprints = await ctx.db
        .query("project_fingerprints")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(limit);

      return fingerprints.map(fingerprint => ({
        _id: fingerprint._id,
        _creationTime: fingerprint._creationTime,
        projectId: fingerprint.projectId,
        userId: fingerprint.userId,
        name: fingerprint.name,
        description: fingerprint.description,

        // AI-Discovered Project Nature
        domain: fingerprint.domain,
        complexity_level: fingerprint.complexity_level,
        collaboration_style: fingerprint.collaboration_style,
        time_horizon: fingerprint.time_horizon,
        primary_pattern: fingerprint.primary_pattern,

        // Intentions summary
        core_intention: fingerprint.core_intention || '',

        // Timeline summary
        natural_rhythm: fingerprint.natural_rhythm || 'daily',
        flexibility_preference: fingerprint.flexibility_preference || 'adaptive',

        // Metadata
        created_at: fingerprint.created_at,
        last_evolution: fingerprint.last_evolution,
        intelligence_version: fingerprint.intelligence_version || '1.0',
        status: fingerprint.status || 'discovering',
      }));
    } catch (error) {
      console.error("Failed to fetch fingerprints for user:", error);
      throw new Error("Failed to fetch fingerprints. Please try again.");
    }
  },
});

// Get fingerprints for a project
export const getFingerprintsForProject = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.string()), // For ownership validation
  },
  returns: v.array(v.object({
    _id: v.id("project_fingerprints"),
    _creationTime: v.number(),
    projectId: v.id("projects"),
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),

    // AI-Discovered Project Nature
    domain: v.string(),
    complexity_level: v.number(),
    collaboration_style: v.string(),
    time_horizon: v.string(),
    primary_pattern: v.string(),

    // Metadata
    created_at: v.number(),
    last_evolution: v.number(),
    intelligence_version: v.string(),
    status: v.string(),
  })),
  handler: async (ctx, args) => {
    try {
      // First validate project ownership if userId provided
      if (args.userId) {
        const project = await ctx.db.get(args.projectId);
        if (!project) {
          throw new Error("Project not found");
        }
        if (project.userId !== args.userId) {
          throw new Error("Access denied: You don't own this project");
        }
      }

      const fingerprints = await ctx.db
        .query("project_fingerprints")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .order("desc")
        .collect();

      return fingerprints.map(fingerprint => ({
        _id: fingerprint._id,
        _creationTime: fingerprint._creationTime,
        projectId: fingerprint.projectId,
        userId: fingerprint.userId,
        name: fingerprint.name,
        description: fingerprint.description,

        // AI-Discovered Project Nature
        domain: fingerprint.domain,
        complexity_level: fingerprint.complexity_level,
        collaboration_style: fingerprint.collaboration_style,
        time_horizon: fingerprint.time_horizon,
        primary_pattern: fingerprint.primary_pattern,

        // Metadata
        created_at: fingerprint.created_at,
        last_evolution: fingerprint.last_evolution,
        intelligence_version: fingerprint.intelligence_version || '1.0',
        status: fingerprint.status || 'discovering',
      }));
    } catch (error) {
      console.error("Failed to fetch fingerprints for project:", error);
      if (error.message.includes("Access denied") || error.message.includes("not found")) {
        throw error;
      }
      throw new Error("Failed to fetch fingerprints. Please try again.");
    }
  },
});

// Get fingerprint with project details
export const getFingerprintWithProject = query({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    userId: v.optional(v.string()), // For ownership validation
  },
  returns: v.union(
    v.null(),
    v.object({
      fingerprint: v.object({
        _id: v.id("project_fingerprints"),
        _creationTime: v.number(),
        projectId: v.id("projects"),
        userId: v.string(),
        name: v.string(),
        description: v.optional(v.string()),

        // AI-Discovered Project Nature
        domain: v.string(),
        complexity_level: v.number(),
        collaboration_style: v.string(),
        time_horizon: v.string(),
        primary_pattern: v.string(),
        working_style: v.array(v.string()),

        // AI-Generated Project Archetype
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
        created_at: v.number(),
        last_evolution: v.number(),
        intelligence_version: v.string(),
        status: v.string(),
      }),
      project: v.object({
        _id: v.id("projects"),
        _creationTime: v.number(),
        userId: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        noteIds: v.optional(v.array(v.string())),
        conversationIds: v.optional(v.array(v.string())),
        instagramPostIds: v.optional(v.array(v.string())),
        youtubeVideoIds: v.optional(v.array(v.string())),
        gmailIds: v.optional(v.array(v.string())),
        analysisIds: v.optional(v.array(v.string())),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const fingerprint = await ctx.db.get(args.fingerprintId);
      if (!fingerprint) {
        return null;
      }

      // Optional: Validate ownership if userId is provided
      if (args.userId && fingerprint.userId !== args.userId) {
        throw new Error("Access denied: You don't own this fingerprint");
      }

      // Get the associated project
      const project = await ctx.db.get(fingerprint.projectId);
      if (!project) {
        throw new Error("Associated project not found");
      }

      return {
        fingerprint,
        project: {
          ...project,
          // Ensure all arrays are defined
          noteIds: project.noteIds || [],
          conversationIds: project.conversationIds || [],
          instagramPostIds: project.instagramPostIds || [],
          youtubeVideoIds: project.youtubeVideoIds || [],
          gmailIds: project.gmailIds || [],
          analysisIds: project.analysisIds || [],
        },
      };
    } catch (error) {
      console.error("Failed to fetch fingerprint with project:", error);
      if (error.message.includes("Access denied") || error.message.includes("not found")) {
        throw error;
      }
      throw new Error("Failed to fetch fingerprint with project. Please try again.");
    }
  },
});

// Search fingerprints by domain
export const searchFingerprintsByDomain = query({
  args: {
    userId: v.string(),
    domain: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("project_fingerprints"),
    _creationTime: v.number(),
    projectId: v.id("projects"),
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    domain: v.string(),
    complexity_level: v.number(),
    primary_pattern: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    // Validate inputs
    if (!args.userId || args.userId.trim() === '') {
      throw new Error("Valid user ID is required");
    }

    if (!args.domain || args.domain.trim() === '') {
      throw new Error("Valid domain is required");
    }

    try {
      const limit = args.limit || 20;
      const fingerprints = await ctx.db
        .query("project_fingerprints")
        .withIndex("by_domain", (q) => q.eq("domain", args.domain))
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .order("desc")
        .take(limit);

      return fingerprints.map(fingerprint => ({
        _id: fingerprint._id,
        _creationTime: fingerprint._creationTime,
        projectId: fingerprint.projectId,
        userId: fingerprint.userId,
        name: fingerprint.name,
        description: fingerprint.description,
        domain: fingerprint.domain,
        complexity_level: fingerprint.complexity_level,
        primary_pattern: fingerprint.primary_pattern,
        createdAt: fingerprint.created_at,
        updatedAt: fingerprint.last_evolution,
      }));
    } catch (error) {
      console.error("Failed to search fingerprints by domain:", error);
      throw new Error("Failed to search fingerprints. Please try again.");
    }
  },
});

// Get recently evolved fingerprints
export const getRecentlyEvolvedFingerprints = query({
  args: {
    userId: v.string(),
    since: v.optional(v.number()), // timestamp
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("project_fingerprints"),
    _creationTime: v.number(),
    projectId: v.id("projects"),
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    domain: v.string(),
    last_evolution_at: v.number(),
    evolution_count: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    // Validate user ID
    if (!args.userId || args.userId.trim() === '') {
      throw new Error("Valid user ID is required");
    }

    try {
      const since = args.since || (Date.now() - (7 * 24 * 60 * 60 * 1000)); // Default to last 7 days
      const limit = args.limit || 20;

      const fingerprints = await ctx.db
        .query("project_fingerprints")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.gte(q.field("last_evolution"), since))
        .order("desc")
        .take(limit);

      return fingerprints.map(fingerprint => ({
        _id: fingerprint._id,
        _creationTime: fingerprint._creationTime,
        projectId: fingerprint.projectId,
        userId: fingerprint.userId,
        name: fingerprint.name,
        description: fingerprint.description,
        domain: fingerprint.domain,
        last_evolution_at: fingerprint.last_evolution,
        evolution_count: 0, // TODO: Calculate actual evolution count
        createdAt: fingerprint.created_at,
        updatedAt: fingerprint.last_evolution,
      }));
    } catch (error) {
      console.error("Failed to fetch recently evolved fingerprints:", error);
      throw new Error("Failed to fetch recently evolved fingerprints. Please try again.");
    }
  },
});
