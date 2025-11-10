/**
 * Artifact Version Queries
 * 
 * CRITICAL: Follows CONVEX_SAVE_ABSOLUTE_LAW
 * - Queries version history for artifacts
 * - Uses proper indexes for performance
 * - Returns version records with full snapshots
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all versions for an artifact
 * Ordered by versionNumber DESC (newest first)
 */
export const getArtifactVersions = query({
  args: {
    artifactId: v.id("artifacts"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    return await ctx.db
      .query("artifact_versions")
      .withIndex("by_artifact", (q) => q.eq("artifactId", args.artifactId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get specific version by number
 */
export const getVersionByNumber = query({
  args: {
    artifactId: v.id("artifacts"),
    versionNumber: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("artifact_versions")
      .withIndex("by_artifact_version", (q) =>
        q.eq("artifactId", args.artifactId).eq("versionNumber", args.versionNumber)
      )
      .first();
  },
});

/**
 * Get latest version for an artifact
 */
export const getLatestVersion = query({
  args: {
    artifactId: v.id("artifacts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("artifact_versions")
      .withIndex("by_latest", (q) =>
        q.eq("artifactId", args.artifactId).eq("isLatest", true)
      )
      .first();
  },
});

