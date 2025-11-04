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

