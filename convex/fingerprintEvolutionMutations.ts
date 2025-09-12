import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Validation helpers
function validateConfidenceScore(score: number): number {
  if (score < 0 || score > 1) {
    throw new Error("Confidence score must be between 0 and 1");
  }
  return score;
}

function validateEvolutionTrigger(trigger: string): string {
  const validTriggers = ['morning_update', 'evening_update', 'data_change', 'user_edit', 'milestone_reached', 'ai_insight', 'manual_evolution'];
  if (!validTriggers.includes(trigger)) {
    throw new Error(`Invalid evolution trigger: ${trigger}. Must be one of: ${validTriggers.join(', ')}`);
  }
  return trigger;
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

// Create evolution history entry
export const createEvolutionEntry = mutation({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    userId: v.optional(v.string()), // For ownership validation
    projectId: v.id("projects"),

    // Evolution details
    timestamp: v.number(),
    evolution_trigger: v.string(), // "morning_update", "evening_update", "data_change", "user_edit", "milestone_reached"

    // What changed (flattened for AI searchability)
    changes_made: v.record(v.string(), v.any()), // Key-value pairs of what changed
    reasoning: v.string(), // AI reasoning for the evolution
    confidence_score: v.number(), // 0-1 confidence in the evolution

    // User response to evolution
    user_response: v.optional(v.string()), // "accepted", "modified", "rejected"
    user_feedback: v.optional(v.string()), // Any user comments on the evolution

    // Learning captured for future evolutions
    learning_captured: v.string(), // What AI learned from this evolution

    // Context of evolution
    trigger_context: v.optional(v.record(v.string(), v.any())), // Additional context about what triggered the evolution
    evolution_metrics: v.optional(v.record(v.string(), v.number())), // Metrics about the evolution process

    // Metadata
    processing_time_ms: v.optional(v.number()),
    ai_model_version: v.optional(v.string()),
  },
  returns: v.id("fingerprint_evolution_history"),
  handler: async (ctx, args) => {
    // Validate fingerprint ownership
    await validateFingerprintOwnership(ctx, args.fingerprintId, args.userId);

    // Validate inputs
    const validatedTrigger = validateEvolutionTrigger(args.evolution_trigger);
    const validatedConfidence = validateConfidenceScore(args.confidence_score);

    try {
      const evolutionId = await ctx.db.insert("fingerprint_evolution_history", {
        fingerprintId: args.fingerprintId,
        userId: args.userId || '',
        projectId: args.projectId,

        timestamp: args.timestamp,
        evolution_trigger: validatedTrigger,
        changes_made: args.changes_made,
        reasoning: args.reasoning,
        confidence_score: validatedConfidence,

        user_response: args.user_response,
        user_feedback: args.user_feedback,
        learning_captured: args.learning_captured,

        trigger_context: args.trigger_context,
        evolution_metrics: args.evolution_metrics,

        processing_time_ms: args.processing_time_ms,
        ai_model_version: args.ai_model_version,
      });

      // Update the fingerprint's evolution metadata
      const fingerprint = await ctx.db.get(args.fingerprintId);
      if (fingerprint) {
        await ctx.db.patch(args.fingerprintId, {
          last_evolution: args.timestamp,
        });
      }

      return evolutionId;
    } catch (error) {
      console.error("Failed to create evolution entry:", error);
      throw new Error("Failed to create evolution entry. Please try again.");
    }
  },
});

// Create bulk evolution entries
export const createBulkEvolutionEntries = mutation({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    userId: v.optional(v.string()), // For ownership validation
    projectId: v.id("projects"),

    // Array of evolution entries
    entries: v.array(v.object({
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
  },
  returns: v.array(v.id("fingerprint_evolution_history")),
  handler: async (ctx, args) => {
    // Validate fingerprint ownership
    await validateFingerprintOwnership(ctx, args.fingerprintId, args.userId);

    const evolutionIds: Id<"fingerprint_evolution_history">[] = [];

    try {
      // Create all evolution entries
      for (const entry of args.entries) {
        const evolutionId = await ctx.db.insert("fingerprint_evolution_history", {
          fingerprintId: args.fingerprintId,
          userId: args.userId || '',
          projectId: args.projectId,

          timestamp: entry.timestamp,
          evolution_trigger: entry.evolution_trigger,
          changes_made: entry.changes_made,
          reasoning: entry.reasoning,
          confidence_score: entry.confidence_score,

          user_response: entry.user_response,
          user_feedback: entry.user_feedback,
          learning_captured: entry.learning_captured,

          trigger_context: entry.trigger_context,
          evolution_metrics: entry.evolution_metrics,

          processing_time_ms: entry.processing_time_ms,
          ai_model_version: entry.ai_model_version,
        });

        evolutionIds.push(evolutionId);
      }

      // Update the fingerprint's evolution metadata with the latest timestamp
      const latestTimestamp = Math.max(...args.entries.map(e => e.timestamp));
      const fingerprint = await ctx.db.get(args.fingerprintId);
      if (fingerprint) {
        await ctx.db.patch(args.fingerprintId, {
          last_evolution: latestTimestamp,
        });
      }

      return evolutionIds;
    } catch (error) {
      console.error("Failed to create bulk evolution entries:", error);
      throw new Error("Failed to create evolution entries. Please try again.");
    }
  },
});

// Update evolution entry
export const updateEvolutionEntry = mutation({
  args: {
    evolutionId: v.id("fingerprint_evolution_history"),
    userId: v.optional(v.string()), // For ownership validation

    // Updatable fields
    user_response: v.optional(v.string()),
    user_feedback: v.optional(v.string()),
    evolution_metrics: v.optional(v.record(v.string(), v.number())),
  },
  returns: v.id("fingerprint_evolution_history"),
  handler: async (ctx, args) => {
    // Get the evolution entry to validate ownership
    const evolutionEntry = await ctx.db.get(args.evolutionId);
    if (!evolutionEntry) {
      throw new Error("Evolution entry not found");
    }

    // Validate ownership
    if (args.userId && evolutionEntry.userId !== args.userId) {
      throw new Error("Access denied: You don't own this evolution entry");
    }

    const updates: any = {};

    // Update fields if provided
    if (args.user_response !== undefined) updates.user_response = args.user_response;
    if (args.user_feedback !== undefined) updates.user_feedback = args.user_feedback;
    if (args.evolution_metrics !== undefined) updates.evolution_metrics = args.evolution_metrics;

    if (Object.keys(updates).length === 0) {
      return args.evolutionId; // No changes needed
    }

    try {
      await ctx.db.patch(args.evolutionId, updates);
      return args.evolutionId;
    } catch (error) {
      console.error("Failed to update evolution entry:", error);
      throw new Error("Failed to update evolution entry. Please try again.");
    }
  },
});

// Delete evolution entry
export const deleteEvolutionEntry = mutation({
  args: {
    evolutionId: v.id("fingerprint_evolution_history"),
    userId: v.optional(v.string()), // For ownership validation
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get the evolution entry to validate ownership
    const evolutionEntry = await ctx.db.get(args.evolutionId);
    if (!evolutionEntry) {
      throw new Error("Evolution entry not found");
    }

    // Validate ownership
    if (args.userId && evolutionEntry.userId !== args.userId) {
      throw new Error("Access denied: You don't own this evolution entry");
    }

    try {
      await ctx.db.delete(args.evolutionId);
      return true;
    } catch (error) {
      console.error("Failed to delete evolution entry:", error);
      throw new Error("Failed to delete evolution entry. Please try again.");
    }
  },
});

// Create AI-triggered evolution entry
export const createAITriggeredEvolution = mutation({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    userId: v.optional(v.string()), // For ownership validation
    projectId: v.id("projects"),

    // AI insights
    evolution_trigger: v.string(),
    changes_made: v.record(v.string(), v.any()),
    reasoning: v.string(),
    confidence_score: v.number(),
    learning_captured: v.string(),

    // Context
    trigger_context: v.optional(v.record(v.string(), v.any())),
    evolution_metrics: v.optional(v.record(v.string(), v.number())),

    // Metadata
    processing_time_ms: v.optional(v.number()),
    ai_model_version: v.optional(v.string()),
  },
  returns: v.id("fingerprint_evolution_history"),
  handler: async (ctx, args) => {
    // Validate fingerprint ownership
    await validateFingerprintOwnership(ctx, args.fingerprintId, args.userId);

    // Validate inputs
    const validatedTrigger = validateEvolutionTrigger(args.evolution_trigger);
    const validatedConfidence = validateConfidenceScore(args.confidence_score);

    const now = Date.now();

    try {
      const evolutionId = await ctx.db.insert("fingerprint_evolution_history", {
        fingerprintId: args.fingerprintId,
        userId: args.userId || '',
        projectId: args.projectId,

        timestamp: now,
        evolution_trigger: validatedTrigger,
        changes_made: args.changes_made,
        reasoning: args.reasoning,
        confidence_score: validatedConfidence,

        learning_captured: args.learning_captured,

        trigger_context: args.trigger_context,
        evolution_metrics: args.evolution_metrics,

        processing_time_ms: args.processing_time_ms,
        ai_model_version: args.ai_model_version,
      });

      // Update the fingerprint's evolution metadata
      const fingerprint = await ctx.db.get(args.fingerprintId);
      if (fingerprint) {
        await ctx.db.patch(args.fingerprintId, {
          last_evolution: now,
        });
      }

      return evolutionId;
    } catch (error) {
      console.error("Failed to create AI-triggered evolution:", error);
      throw new Error("Failed to create AI-triggered evolution. Please try again.");
    }
  },
});