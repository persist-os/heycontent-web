import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Assignment Fingerprint Queries
 * 
 * Read-only access to assignment fingerprints.
 * Following Pattern 2 (Backend-to-Convex Bridge) from patterns.md
 */

/**
 * Get assignment fingerprint by project ID
 * Used by: Backend fingerprint updater agent
 * 
 * ✅ SECURITY: Requires userId to prevent unauthorized access
 */
export const getByProject = query({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, { projectId, userId }) => {
    const fingerprint = await ctx.db
      .query("assignment_fingerprints")
      .withIndex("by_project_user", (q) => 
        q.eq("projectId", projectId).eq("userId", userId)
      )
      .first();
    
    return fingerprint;
  },
});

/**
 * Query insights by category, time, confidence
 * For decision engine and rich analysis
 * 
 * ✅ SECURITY: Requires userId for ownership validation
 */
export const queryInsights = query({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    category: v.optional(v.string()),       // Filter by category
    since: v.optional(v.number()),          // Filter by timestamp
    minConfidence: v.optional(v.number()),  // Filter by confidence
    limit: v.optional(v.number()),          // Max results
  },
  handler: async (ctx, args) => {
    const fingerprint = await ctx.db
      .query("assignment_fingerprints")
      .withIndex("by_project_user", (q) => 
        q.eq("projectId", args.projectId).eq("userId", args.userId)
      )
      .first();
    
    if (!fingerprint) return [];
    
    let insights = fingerprint.insights || [];
    
    // Apply filters
    if (args.category) {
      insights = insights.filter(i => i.category === args.category);
    }
    if (args.since) {
      insights = insights.filter(i => i.timestamp >= args.since);
    }
    if (args.minConfidence !== undefined) {
      insights = insights.filter(i => (i.confidence || 0) >= args.minConfidence);
    }
    
    // Sort by timestamp (newest first)
    insights.sort((a, b) => b.timestamp - a.timestamp);
    
    // Limit results
    if (args.limit) {
      insights = insights.slice(0, args.limit);
    }
    
    return insights;
  },
});

/**
 * Get current preferences - FAST query for A2A coordination
 * Optimized for <10ms response time (denormalized data)
 * 
 * ✅ SECURITY: Requires userId for ownership validation
 */
export const getCurrentPreferences = query({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, { projectId, userId }) => {
    const fingerprint = await ctx.db
      .query("assignment_fingerprints")
      .withIndex("by_project_user", (q) => 
        q.eq("projectId", projectId).eq("userId", userId)
      )
      .first();
    
    if (!fingerprint) return null;
    
    // Return only fast-access fields (denormalized)
    return {
      currentGoals: fingerprint.currentGoals || [],
      currentConstraints: fingerprint.currentConstraints || [],
      currentTimeline: fingerprint.currentTimeline || null,
      widgetPreferences: fingerprint.widgetPreferences || {},
      totalInsights: fingerprint.totalInsights || 0,
      lastEvolution: fingerprint.lastEvolution || fingerprint.updatedAt,
    };
  },
});

