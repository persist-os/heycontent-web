import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get evolution history for a fingerprint
export const getFingerprintEvolutionHistory = query({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    userId: v.optional(v.string()), // For ownership validation
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("fingerprint_evolution_history"),
    _creationTime: v.number(),
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),
    projectId: v.id("projects"),

    // Evolution details
    timestamp: v.number(),
    evolution_trigger: v.string(),
    changes_made: v.record(v.string(), v.any()),
    reasoning: v.string(),
    confidence_score: v.number(),

    // User response
    user_response: v.optional(v.string()),
    user_feedback: v.optional(v.string()),
    learning_captured: v.string(),

    // Context and metadata
    trigger_context: v.optional(v.record(v.string(), v.any())),
    evolution_metrics: v.optional(v.record(v.string(), v.number())),
    processing_time_ms: v.optional(v.number()),
    ai_model_version: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    try {
      // Validate fingerprint ownership if userId provided
      if (args.userId) {
        const fingerprint = await ctx.db.get(args.fingerprintId);
        if (!fingerprint) {
          throw new Error("Fingerprint not found");
        }
        if (fingerprint.userId !== args.userId) {
          throw new Error("Access denied: You don't own this fingerprint");
        }
      }

      const limit = args.limit || 50;

      const evolutionHistory = await ctx.db
        .query("fingerprint_evolution_history")
        .withIndex("by_fingerprint", (q) => q.eq("fingerprintId", args.fingerprintId))
        .order("desc")
        .take(limit);

      return evolutionHistory;
    } catch (error) {
      console.error("Failed to fetch fingerprint evolution history:", error);
      if (error.message.includes("Access denied") || error.message.includes("not found")) {
        throw error;
      }
      throw new Error("Failed to fetch evolution history. Please try again.");
    }
  },
});

// Get evolution history by trigger type
export const getEvolutionHistoryByTrigger = query({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    userId: v.optional(v.string()), // For ownership validation
    evolution_trigger: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("fingerprint_evolution_history"),
    _creationTime: v.number(),
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),
    projectId: v.id("projects"),

    timestamp: v.number(),
    evolution_trigger: v.string(),
    changes_made: v.record(v.string(), v.any()),
    reasoning: v.string(),
    confidence_score: v.number(),

    user_response: v.optional(v.string()),
    user_feedback: v.optional(v.string()),
    learning_captured: v.string(),

    trigger_context: v.optional(v.record(v.string(), v.any())),
    evolution_metrics: v.optional(v.record(v.string(), v.number())),
    processing_time_ms: v.optional(v.number()),
    ai_model_version: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    try {
      // Validate fingerprint ownership if userId provided
      if (args.userId) {
        const fingerprint = await ctx.db.get(args.fingerprintId);
        if (!fingerprint) {
          throw new Error("Fingerprint not found");
        }
        if (fingerprint.userId !== args.userId) {
          throw new Error("Access denied: You don't own this fingerprint");
        }
      }

      const limit = args.limit || 50;

      const evolutionHistory = await ctx.db
        .query("fingerprint_evolution_history")
        .withIndex("by_fingerprint", (q) => q.eq("fingerprintId", args.fingerprintId))
        .filter((q) => q.eq(q.field("evolution_trigger"), args.evolution_trigger))
        .order("desc")
        .take(limit);

      return evolutionHistory;
    } catch (error) {
      console.error("Failed to fetch evolution history by trigger:", error);
      if (error.message.includes("Access denied") || error.message.includes("not found")) {
        throw error;
      }
      throw new Error("Failed to fetch evolution history. Please try again.");
    }
  },
});

// Get evolution history by confidence score range
export const getEvolutionHistoryByConfidence = query({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    userId: v.optional(v.string()), // For ownership validation
    min_confidence: v.optional(v.number()), // 0-1 range
    max_confidence: v.optional(v.number()), // 0-1 range
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("fingerprint_evolution_history"),
    _creationTime: v.number(),
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),
    projectId: v.id("projects"),

    timestamp: v.number(),
    evolution_trigger: v.string(),
    changes_made: v.record(v.string(), v.any()),
    reasoning: v.string(),
    confidence_score: v.number(),

    user_response: v.optional(v.string()),
    user_feedback: v.optional(v.string()),
    learning_captured: v.string(),

    trigger_context: v.optional(v.record(v.string(), v.any())),
    evolution_metrics: v.optional(v.record(v.string(), v.number())),
    processing_time_ms: v.optional(v.number()),
    ai_model_version: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    try {
      // Validate fingerprint ownership if userId provided
      if (args.userId) {
        const fingerprint = await ctx.db.get(args.fingerprintId);
        if (!fingerprint) {
          throw new Error("Fingerprint not found");
        }
        if (fingerprint.userId !== args.userId) {
          throw new Error("Access denied: You don't own this fingerprint");
        }
      }

      const limit = args.limit || 50;
      const minConfidence = args.min_confidence || 0;
      const maxConfidence = args.max_confidence || 1;

      const evolutionHistory = await ctx.db
        .query("fingerprint_evolution_history")
        .withIndex("by_fingerprint", (q) => q.eq("fingerprintId", args.fingerprintId))
        .filter((q) => q.gte(q.field("confidence_score"), minConfidence))
        .filter((q) => q.lte(q.field("confidence_score"), maxConfidence))
        .order("desc")
        .take(limit);

      return evolutionHistory;
    } catch (error) {
      console.error("Failed to fetch evolution history by confidence:", error);
      if (error.message.includes("Access denied") || error.message.includes("not found")) {
        throw error;
      }
      throw new Error("Failed to fetch evolution history. Please try again.");
    }
  },
});

// Get recent evolution activity across all user's fingerprints
export const getRecentEvolutionActivity = query({
  args: {
    userId: v.string(),
    since: v.optional(v.number()), // timestamp
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("fingerprint_evolution_history"),
    _creationTime: v.number(),
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),
    projectId: v.id("projects"),

    timestamp: v.number(),
    evolution_trigger: v.string(),
    changes_made: v.record(v.string(), v.any()),
    reasoning: v.string(),
    confidence_score: v.number(),

    user_response: v.optional(v.string()),
    user_feedback: v.optional(v.string()),
    learning_captured: v.string(),

    // Enriched data
    fingerprint_name: v.string(),
    project_name: v.string(),
  })),
  handler: async (ctx, args) => {
    // Validate user ID
    if (!args.userId || args.userId.trim() === '') {
      throw new Error("Valid user ID is required");
    }

    try {
      const since = args.since || (Date.now() - (7 * 24 * 60 * 60 * 1000)); // Default to last 7 days
      const limit = args.limit || 50;

      // Get evolution history for user's fingerprints
      const evolutionHistory = await ctx.db
        .query("fingerprint_evolution_history")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .filter((q) => q.gte(q.field("timestamp"), since))
        .order("desc")
        .take(limit);

      // Enrich with fingerprint and project info
      const enrichedHistory = await Promise.all(
        evolutionHistory.map(async (entry) => {
          try {
            const fingerprint = await ctx.db.get(entry.fingerprintId);
            if (!fingerprint) {
              return null;
            }

            const project = await ctx.db.get(entry.projectId);
            if (!project) {
              return null;
            }

            return {
              ...entry,
              fingerprint_name: fingerprint.name,
              project_name: project.name,
            };
          } catch (error) {
            console.warn(`Failed to enrich evolution entry ${entry._id}:`, error);
            return null;
          }
        })
      );

      return enrichedHistory.filter(Boolean);
    } catch (error) {
      console.error("Failed to fetch recent evolution activity:", error);
      throw new Error("Failed to fetch recent evolution activity. Please try again.");
    }
  },
});

// Get evolution statistics for a fingerprint
export const getFingerprintEvolutionStats = query({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    userId: v.optional(v.string()), // For ownership validation
  },
  returns: v.object({
    total_evolutions: v.number(),
    evolutions_by_trigger: v.record(v.string(), v.number()),
    average_confidence: v.number(),
    recent_activity_count: v.number(),
    last_evolution_timestamp: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    try {
      // Validate fingerprint ownership if userId provided
      if (args.userId) {
        const fingerprint = await ctx.db.get(args.fingerprintId);
        if (!fingerprint) {
          throw new Error("Fingerprint not found");
        }
        if (fingerprint.userId !== args.userId) {
          throw new Error("Access denied: You don't own this fingerprint");
        }
      }

      // Get all evolution history for this fingerprint
      const evolutionHistory = await ctx.db
        .query("fingerprint_evolution_history")
        .withIndex("by_fingerprint", (q) => q.eq("fingerprintId", args.fingerprintId))
        .collect();

      // Calculate statistics
      const totalEvolutions = evolutionHistory.length;

      const evolutionsByTrigger: Record<string, number> = {};
      let totalConfidence = 0;

      // Count by trigger type and calculate confidence
      evolutionHistory.forEach(entry => {
        evolutionsByTrigger[entry.evolution_trigger] = (evolutionsByTrigger[entry.evolution_trigger] || 0) + 1;
        totalConfidence += entry.confidence_score;
      });

      const averageConfidence = totalEvolutions > 0 ? totalConfidence / totalEvolutions : 0;

      // Recent activity (last 24 hours)
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const recentActivityCount = evolutionHistory.filter(
        entry => entry.timestamp >= oneDayAgo
      ).length;

      // Last evolution timestamp
      const lastEvolutionTimestamp = evolutionHistory.length > 0
        ? Math.max(...evolutionHistory.map(e => e.timestamp))
        : null;

      return {
        total_evolutions: totalEvolutions,
        evolutions_by_trigger: evolutionsByTrigger,
        average_confidence: averageConfidence,
        recent_activity_count: recentActivityCount,
        last_evolution_timestamp: lastEvolutionTimestamp,
      };
    } catch (error) {
      console.error("Failed to fetch fingerprint evolution stats:", error);
      if (error.message.includes("Access denied") || error.message.includes("not found")) {
        throw error;
      }
      throw new Error("Failed to fetch evolution statistics. Please try again.");
    }
  },
});
