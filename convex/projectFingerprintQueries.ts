import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Get a fingerprint by its ID
 */
export const getFingerprint = query({
  args: {
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),
  },
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
