import { query } from "./_generated/server";
import { v, Infer } from "convex/values";
import { Id } from "./_generated/dataModel";

// Shared validators
const FingerprintValidator = v.object({
  _id: v.id("project_fingerprints"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  userId: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  domain: v.string(),
  complexity_level: v.number(),
  collaboration_style: v.string(),
  time_horizon: v.string(),
  primary_pattern: v.string(),
  working_style: v.array(v.string()),
  decision_making: v.string(),
  energy_patterns: v.string(),
  core_intention: v.string(),
  success_vision: v.string(),
  value_creation: v.string(),
  personal_growth: v.array(v.string()),
  natural_rhythm: v.string(),
  key_phases: v.array(v.object({
    name: v.string(),
    essence: v.string(),
    estimated_duration: v.string(),
    readiness_indicators: v.array(v.string()),
  })),
  flexibility_preference: v.string(),
  tangible_deliverables: v.array(v.string()),
  intangible_benefits: v.array(v.string()),
  measurement_approach: v.string(),
  sharing_intention: v.string(),
  cognitive_load_preference: v.string(),
  information_density: v.string(),
  motivation_style: v.array(v.string()),
  feedback_frequency: v.string(),
  learning_sensitivity: v.number(),
  change_triggers: v.array(v.object({
    condition_type: v.string(),
    threshold: v.number(),
    response_style: v.string(),
  })),
  stability_zones: v.array(v.string()),
  growth_edges: v.array(v.string()),
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
  base_personality: v.string(),
  project_voice: v.string(),
  question_generation_style: v.string(),
  suggestion_approach: v.string(),
  clarification_method: v.string(),
  dynamic_dimensions: v.array(v.object({
    dimension_name: v.string(),
    dimension_type: v.string(),
    measurement_approach: v.string(),
    evolution_sensitivity: v.number(),
    ui_representation: v.string(),
  })),
  user_constraints: v.array(v.string()),
  external_dependencies: v.array(v.string()),
  support_systems: v.array(v.string()),
  potential_obstacles: v.array(v.string()),
  created_at: v.number(),
  last_evolution: v.number(),
  intelligence_version: v.string(),
  status: v.string(),
});

const FingerprintStatsValidator = v.object({
  total: v.number(),
  byDomain: v.record(v.string(), v.number()),
  byStatus: v.record(v.string(), v.number()),
  byComplexity: v.object({
    low: v.number(),
    medium: v.number(),
    high: v.number(),
  }),
  averageComplexity: v.number(),
  mostRecent: v.union(v.null(), FingerprintValidator),
  oldest: v.union(v.null(), FingerprintValidator),
});

// Infer TypeScript types
export type Fingerprint = Infer<typeof FingerprintValidator>;
export type FingerprintStats = Infer<typeof FingerprintStatsValidator>;

/**
 * Get a fingerprint by its ID
 */
export const getFingerprint = query({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),
  },
  returns: v.union(v.null(), FingerprintValidator),
  handler: async (ctx, args) => {
    const fingerprint = await ctx.db.get(args.fingerprintId);
    
    if (!fingerprint) {
      return null;
    }

    // Verify the fingerprint belongs to the user
    if (fingerprint.userId !== args.userId) {
      console.error("Fingerprint userId mismatch:", { 
        fingerprintUserId: fingerprint.userId, 
        requestedUserId: args.userId,
        fingerprintId: args.fingerprintId 
      });
      throw new Error("Unauthorized: Fingerprint does not belong to user");
    }

    return fingerprint;
  },
});

/**
 * Get a fingerprint by project ID
 */
export const getFingerprintByProject = query({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  returns: v.union(v.null(), FingerprintValidator),
  handler: async (ctx, args) => {
    // First get the project to verify ownership
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    if (project.userId !== args.userId) {
      throw new Error("Unauthorized: Project does not belong to user");
    }

    // If project has a fingerprint, get it
    if (project.fingerprintId) {
      const fingerprint = await ctx.db.get(project.fingerprintId);
      return fingerprint;
    }

    return null;
  },
});

/**
 * List all fingerprints for a user
 */
export const listUserFingerprints = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(FingerprintValidator),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const fingerprints = await ctx.db
      .query("project_fingerprints")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return fingerprints;
  },
});

/**
 * List fingerprints by domain
 */
export const listFingerprintsByDomain = query({
  args: {
    userId: v.string(),
    domain: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(FingerprintValidator),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const fingerprints = await ctx.db
      .query("project_fingerprints")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(limit);

    return fingerprints;
  },
});

/**
 * List fingerprints by status
 */
export const listFingerprintsByStatus = query({
  args: {
    userId: v.string(),
    status: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(FingerprintValidator),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const fingerprints = await ctx.db
      .query("project_fingerprints")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(limit);

    return fingerprints;
  },
});

/**
 * Search fingerprints by name or description
 */
export const searchFingerprints = query({
  args: {
    userId: v.string(),
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(FingerprintValidator),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    // Get all user fingerprints and filter by search term
    const allFingerprints = await ctx.db
      .query("project_fingerprints")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter by search term (case-insensitive)
    const searchLower = args.searchTerm.toLowerCase();
    const filtered = allFingerprints.filter(fingerprint => 
      fingerprint.name.toLowerCase().includes(searchLower) ||
      (fingerprint.description && fingerprint.description.toLowerCase().includes(searchLower)) ||
      fingerprint.domain.toLowerCase().includes(searchLower) ||
      fingerprint.primary_pattern.toLowerCase().includes(searchLower)
    );

    // Sort by creation date and limit
    return filtered
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, limit);
  },
});

/**
 * Get fingerprint statistics for a user
 */
export const getFingerprintStats = query({
  args: {
    userId: v.string(),
  },
  returns: FingerprintStatsValidator,
  handler: async (ctx, args) => {
    const fingerprints = await ctx.db
      .query("project_fingerprints")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Calculate statistics
    const stats = {
      total: fingerprints.length,
      byDomain: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byComplexity: {
        low: 0,    // 1-3
        medium: 0, // 4-7
        high: 0,   // 8-10
      },
      averageComplexity: 0,
      mostRecent: null as any,
      oldest: null as any,
    };

    let totalComplexity = 0;

    fingerprints.forEach(fingerprint => {
      // Domain distribution
      stats.byDomain[fingerprint.domain] = (stats.byDomain[fingerprint.domain] || 0) + 1;
      
      // Status distribution
      stats.byStatus[fingerprint.status] = (stats.byStatus[fingerprint.status] || 0) + 1;
      
      // Complexity distribution
      if (fingerprint.complexity_level <= 3) {
        stats.byComplexity.low++;
      } else if (fingerprint.complexity_level <= 7) {
        stats.byComplexity.medium++;
      } else {
        stats.byComplexity.high++;
      }
      
      totalComplexity += fingerprint.complexity_level;
      
      // Most recent and oldest
      if (!stats.mostRecent || fingerprint.created_at > stats.mostRecent.created_at) {
        stats.mostRecent = fingerprint;
      }
      if (!stats.oldest || fingerprint.created_at < stats.oldest.created_at) {
        stats.oldest = fingerprint;
      }
    });

    // Calculate average complexity
    if (fingerprints.length > 0) {
      stats.averageComplexity = totalComplexity / fingerprints.length;
    }

    return stats;
  },
});

/**
 * Get fingerprints that need evolution (haven't been updated recently)
 */
export const getFingerprintsNeedingEvolution = query({
  args: {
    userId: v.string(),
    daysSinceLastEvolution: v.optional(v.number()),
  },
  returns: v.array(FingerprintValidator),
  handler: async (ctx, args) => {
    const daysSince = args.daysSinceLastEvolution || 7;
    const cutoffTime = Date.now() - (daysSince * 24 * 60 * 60 * 1000);
    
    const fingerprints = await ctx.db
      .query("project_fingerprints")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.lt(q.field("last_evolution"), cutoffTime),
          q.eq(q.field("status"), "active")
        )
      )
      .collect();

    return fingerprints;
  },
});
