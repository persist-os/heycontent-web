/**
 * Artifact Queries
 * 
 * Simple, focused queries for artifact retrieval
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get artifacts for a project
 */
export const getProjectArtifacts = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("artifacts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

/**
 * Get artifacts for a widget
 */
export const getWidgetArtifacts = query({
  args: {
    widgetId: v.id("widgets"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("artifacts")
      .withIndex("by_widget", (q) => q.eq("widgetId", args.widgetId))
      .order("desc")
      .collect();
  },
});

/**
 * Get single artifact by ID
 */
export const getArtifact = query({
  args: {
    artifactId: v.id("artifacts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.artifactId);
  },
});

/**
 * Get user's artifacts across all projects
 */
export const getUserArtifacts = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("artifacts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");
    
    if (args.limit) {
      return await query.take(args.limit);
    }
    
    return await query.collect();
  },
});

