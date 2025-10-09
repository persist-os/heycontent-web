import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Fingerprint Evolution Signals Queries
 */

/**
 * Get signals for a fingerprint
 */
export const getByFingerprint = query({
  args: {
    fingerprintId: v.id("project_fingerprints"),
  },
  handler: async (ctx, { fingerprintId }) => {
    return await ctx.db
      .query("fingerprint_evolution_signals")
      .withIndex("by_fingerprint", (q) => q.eq("fingerprintId", fingerprintId))
      .first();
  },
});

/**
 * Get signals for a project
 */
export const getByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    return await ctx.db
      .query("fingerprint_evolution_signals")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();
  },
});

/**
 * Get all fingerprints with high evolution signals (for backend MAB)
 */
export const getHighSignals = query({
  args: {
    userId: v.string(),
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, { userId, threshold = 0.5 }) => {
    const signals = await ctx.db
      .query("fingerprint_evolution_signals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    return signals.filter(s => s.evolution_signal_score >= threshold);
  },
});

/**
 * Get all signals for a user (for monitoring)
 */
export const getAllByUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("fingerprint_evolution_signals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

