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

/**
 * Flexible query for artifacts with filters
 * Used by backend toolkit for artifact-aware widget operations
 * 
 * Supports filtering by:
 * - projectId: Filter by project
 * - widgetId: Filter by widget
 * - outputId: Legacy field (ignored - artifacts don't have outputId)
 * - userId: Ownership verification (required)
 */
export const queryArtifacts = query({
  args: {
    userId: v.string(),
    filters: v.optional(v.object({
      projectId: v.optional(v.union(v.string(), v.id("projects"))),
      widgetId: v.optional(v.union(v.string(), v.id("widgets"))),
      outputId: v.optional(v.string()), // Legacy field - ignored
    })),
    limit: v.optional(v.number()),
    orderBy: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const filters = args.filters || {};
    const orderBy = args.orderBy || "desc";
    
    // Build query based on available filters
    // Priority: widgetId > projectId > userId (most specific first)
    if (filters.widgetId) {
      // Filter by widget (most specific)
      const widgetId = typeof filters.widgetId === "string" 
        ? filters.widgetId as any 
        : filters.widgetId;
      
      const artifactQuery = ctx.db
        .query("artifacts")
        .withIndex("by_widget", (q) => q.eq("widgetId", widgetId));
      
      // Apply user filter (ownership verification)
      const results = orderBy === "desc" 
        ? await artifactQuery.order("desc").collect()
        : await artifactQuery.order("asc").collect();
      
      // Filter by userId for ownership verification
      const userFiltered = results.filter(a => a.userId === args.userId);
      
      // Apply limit
      if (args.limit) {
        return userFiltered.slice(0, args.limit);
      }
      
      return userFiltered;
    } else if (filters.projectId) {
      // Filter by project
      const projectId = typeof filters.projectId === "string"
        ? filters.projectId as any
        : filters.projectId;
      
      const artifactQuery = ctx.db
        .query("artifacts")
        .withIndex("by_project", (q) => q.eq("projectId", projectId));
      
      // Apply user filter (ownership verification)
      const results = orderBy === "desc"
        ? await artifactQuery.order("desc").collect()
        : await artifactQuery.order("asc").collect();
      
      // Filter by userId for ownership verification
      const userFiltered = results.filter(a => a.userId === args.userId);
      
      // Apply limit
      if (args.limit) {
        return userFiltered.slice(0, args.limit);
      }
      
      return userFiltered;
    } else {
      // No specific filters - query by user only
      const artifactQuery = ctx.db
        .query("artifacts")
        .withIndex("by_user", (q) => q.eq("userId", args.userId));
      
      const results = orderBy === "desc"
        ? await artifactQuery.order("desc").collect()
        : await artifactQuery.order("asc").collect();
      
      // Apply limit
      if (args.limit) {
        return results.slice(0, args.limit);
      }
      
      return results;
    }
  },
});

