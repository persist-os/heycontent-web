import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Optimized Project Fingerprint Queries
 * Following Convex best practices for performance and scalability
 */

// ============================================================================
// PRIMARY QUERIES - Most commonly used
// ============================================================================

/**
 * Get fingerprint by project ID - Primary access pattern
 * Used by: Frontend components, backend agents
 */
export const getByProject = query({
  args: { 
    projectId: v.id("projects") 
  },
  handler: async (ctx, { projectId }) => {
    const fingerprint = await ctx.db
      .query("project_fingerprints")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (!fingerprint) return null;

    // Return complete fingerprint data structure for frontend and AI agents
    return {
      _id: fingerprint._id,
      projectId: fingerprint.projectId,
      userId: fingerprint.userId,
      name: fingerprint.name,
      description: fingerprint.description,
      discoveryConversationId: fingerprint.discoveryConversationId,
      
      // AI-Discovered Project Nature
      domain: fingerprint.domain,
      complexity_level: fingerprint.complexity_level,
      collaboration_style: fingerprint.collaboration_style,
      time_horizon: fingerprint.time_horizon,
      
      // AI-Generated Project Archetype
      primary_pattern: fingerprint.primary_pattern,
      working_style: fingerprint.working_style,
      decision_making: fingerprint.decision_making,
      energy_patterns: fingerprint.energy_patterns,
      
      // Intentions (User + AI refined)
      core_intention: fingerprint.core_intention,
      success_vision: fingerprint.success_vision,
      value_creation: fingerprint.value_creation,
      personal_growth: fingerprint.personal_growth,
      
      // Dynamic Timeline
      natural_rhythm: fingerprint.natural_rhythm,
      key_phases: fingerprint.key_phases,
      flexibility_preference: fingerprint.flexibility_preference,
      
      // Output Desires
      tangible_deliverables: fingerprint.tangible_deliverables,
      intangible_benefits: fingerprint.intangible_benefits,
      measurement_approach: fingerprint.measurement_approach,
      sharing_intention: fingerprint.sharing_intention,
      
      // Interface Preferences
      cognitive_load_preference: fingerprint.cognitive_load_preference,
      information_density: fingerprint.information_density,
      motivation_style: fingerprint.motivation_style,
      feedback_frequency: fingerprint.feedback_frequency,
      
      // Evolution Intelligence
      learning_sensitivity: fingerprint.learning_sensitivity,
      change_triggers: fingerprint.change_triggers,
      stability_zones: fingerprint.stability_zones,
      growth_edges: fingerprint.growth_edges,
      
      // AI Agent Coordination
      morning_persona: fingerprint.morning_persona,
      evening_persona: fingerprint.evening_persona,
      event_triggers: fingerprint.event_triggers,
      
      // AI Prompt Generation
      base_personality: fingerprint.base_personality,
      project_voice: fingerprint.project_voice,
      question_generation_style: fingerprint.question_generation_style,
      suggestion_approach: fingerprint.suggestion_approach,
      clarification_method: fingerprint.clarification_method,
      
      // Dynamic Intelligence Fields
      dynamic_dimensions: fingerprint.dynamic_dimensions,
      
      // Contextual Awareness
      user_constraints: fingerprint.user_constraints,
      external_dependencies: fingerprint.external_dependencies,
      support_systems: fingerprint.support_systems,
      potential_obstacles: fingerprint.potential_obstacles,
      
      // Status and metadata
      status: fingerprint.status,
      created_at: fingerprint.created_at,
      last_evolution: fingerprint.last_evolution,
      intelligence_version: fingerprint.intelligence_version,
    };
  },
});

/**
 * Get fingerprint completion status for discovery UI
 * Used by: AmbientFingerprintCanvas, progress indicators
 */
export const getCompletionStatus = query({
  args: { 
    projectId: v.id("projects") 
  },
  handler: async (ctx, { projectId }) => {
    const fingerprint = await ctx.db
      .query("project_fingerprints")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (!fingerprint) {
      return {
        exists: false,
        completion_percentage: 0,
        discovered_fields: [],
        status: "not_started",
      };
    }

    // Calculate discovered fields (non-empty/non-null fields)
    // Updated to include all major fingerprint dimensions
    const coreFields = [
      'domain', 'complexity_level', 'collaboration_style', 'time_horizon',
      'primary_pattern', 'working_style', 'decision_making', 'energy_patterns',
      'core_intention', 'success_vision', 'value_creation', 'personal_growth',
      'natural_rhythm', 'flexibility_preference', 'cognitive_load_preference',
      'information_density', 'feedback_frequency', 'learning_sensitivity',
      'base_personality', 'project_voice'
    ];

    const discoveredFields = coreFields.filter(field => {
      const value = fingerprint[field as keyof typeof fingerprint];
      
      // Check for null/undefined
      if (value === null || value === undefined) return false;
      
      // Check for empty string
      if (value === '') return false;
      
      // Check for empty arrays
      if (Array.isArray(value) && value.length === 0) return false;
      
      // Check for zero numbers (learning_sensitivity valid range is 1-10, so 0 = not discovered)
      if (typeof value === 'number' && value === 0) return false;
      
      return true;
    });

    const completion_percentage = Math.round((discoveredFields.length / coreFields.length) * 100);

    // Debug: Log which fields are missing (helpful for development)
    const missingFields = coreFields.filter(field => !discoveredFields.includes(field));
    console.log(`[getCompletionStatus] Project ${projectId}: ${discoveredFields.length}/${coreFields.length} fields discovered`);
    if (missingFields.length > 0 && missingFields.length <= 10) {
      console.log(`[getCompletionStatus] Missing fields:`, missingFields);
    }

    return {
      exists: true,
      completion_percentage,
      discovered_fields: discoveredFields,
      missing_fields: missingFields, // Add this for debugging in frontend
      status: fingerprint.status,
      last_evolution: fingerprint.last_evolution,
      total_fields: coreFields.length,
    };
  },
});

/**
 * Get full fingerprint for AI agent context
 * Used by: Backend AI agents that need complete context
 */
export const getFullContext = query({
  args: { 
    projectId: v.id("projects") 
  },
  handler: async (ctx, { projectId }) => {
    return await ctx.db
      .query("project_fingerprints")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();
  },
});

// ============================================================================
// EVOLUTION TRACKING QUERIES
// ============================================================================

/**
 * Get recent evolution history for a fingerprint
 * Used by: Evolution tracking, debugging, user history
 */
export const getEvolutionHistory = query({
  args: { 
    fingerprintId: v.id("project_fingerprints"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { fingerprintId, limit = 10 }) => {
    return await ctx.db
      .query("fingerprint_evolution_history")
      .withIndex("by_fingerprint", (q) => q.eq("fingerprintId", fingerprintId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get latest evolution for a project
 * Used by: Understanding most recent changes
 */
export const getLatestEvolution = query({
  args: { 
    projectId: v.id("projects") 
  },
  handler: async (ctx, { projectId }) => {
    return await ctx.db
      .query("fingerprint_evolution_history")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .first();
  },
});

// ============================================================================
// USER-SPECIFIC QUERIES
// ============================================================================

/**
 * Get all fingerprints for a user
 * Used by: User dashboard, fingerprint management
 */
export const getByUser = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    return await ctx.db
      .query("project_fingerprints")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get user's active fingerprints (non-archived)
 * Used by: Active project views
 */
export const getActiveByUser = query({
  args: { 
    userId: v.string() 
  },
  handler: async (ctx, { userId }) => {
    const fingerprints = await ctx.db
      .query("project_fingerprints")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return fingerprints.filter(fp => fp.status !== "archived");
  },
});

// ============================================================================
// ADMINISTRATIVE QUERIES
// ============================================================================

/**
 * Get fingerprints by status for admin monitoring
 * Used by: Admin dashboard, system monitoring
 */
export const getByStatus = query({
  args: { 
    status: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, limit = 100 }) => {
    return await ctx.db
      .query("project_fingerprints")
      .withIndex("by_status", (q) => q.eq("status", status))
      .order("desc")
      .take(limit);
  },
});

/**
 * Check if fingerprint exists for project
 * Used by: Backend validation, quick existence checks
 */
export const exists = query({
  args: { 
    projectId: v.id("projects") 
  },
  handler: async (ctx, { projectId }) => {
    const fingerprint = await ctx.db
      .query("project_fingerprints")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    return !!fingerprint;
  },
});
