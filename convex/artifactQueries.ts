/**
 * Artifact Queries
 * 
 * Simple, focused queries for artifact retrieval
 * ✅ FIX BLOCKER 3/4: All queries check project collaborator access
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { artifactTypeValidator } from "./types/artifact";

/**
 * Get artifacts for a project
 * ✅ FIX BLOCKER 3: Checks project collaborator access
 */
export const getProjectArtifacts = query({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // ✅ FIX: Validate userId first
    if (!args.userId || typeof args.userId !== 'string' || args.userId.trim().length === 0) {
      throw new Error("Invalid userId: userId must be a non-empty string");
    }
    
    // Normalize userId (trim whitespace for consistent comparison)
    const normalizedUserId = args.userId.trim();
    
    // ✅ FIX BLOCKER 3: Check project permission (owner or collaborator)
    // First check if project exists and user owns it (fast path)
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    // Normalize project.userId for comparison
    const normalizedProjectUserId = project.userId?.trim() || project.userId;
    
    // Fast path: User owns the project
    if (normalizedProjectUserId === normalizedUserId) {
      return await ctx.db
        .query("artifacts")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .order("desc")
        .collect();
    }
    
    // Check if user is a collaborator
    const isCollaborator = project.collaborators?.some(
      c => (c.userId?.trim() || c.userId) === normalizedUserId
    );
    if (isCollaborator) {
      return await ctx.db
        .query("artifacts")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .order("desc")
        .collect();
    }
    
    // Fallback: Check shared access via permission helper
    const permission = await ctx.runQuery(api.contentAccessHelpers.getUserContentPermission, {
      userId: normalizedUserId,
      contentType: "project",
      contentId: args.projectId,
    });
    
    if (!permission) {
      // Enhanced error message for debugging
      console.error("Access denied for artifact query:", {
        projectId: args.projectId,
        requestedUserId: normalizedUserId,
        projectUserId: normalizedProjectUserId,
        hasCollaborators: !!project.collaborators?.length,
        collaboratorCount: project.collaborators?.length || 0,
      });
      throw new Error(`Access denied: You don't have permission to view this project. Project owner: ${normalizedProjectUserId}, Requested user: ${normalizedUserId}`);
    }
    
    return await ctx.db
      .query("artifacts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

/**
 * Get artifacts for a widget
 * ✅ FIX BLOCKER 3: Checks widget/project collaborator access
 */
export const getWidgetArtifacts = query({
  args: {
    widgetId: v.id("widgets"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get widget to check project access
    const widget = await ctx.db.get(args.widgetId);
    if (!widget) {
      throw new Error("Widget not found");
    }
    
    // ✅ FIX BLOCKER 3: Check project permission if widget has projectId
    if (widget.projectId) {
      const permission = await ctx.runQuery(api.contentAccessHelpers.getUserContentPermission, {
        userId: args.userId,
        contentType: "project",
        contentId: widget.projectId,
      });
      
      if (!permission) {
        throw new Error("Access denied: You don't have permission to view this project");
      }
    } else {
      // If no projectId, check widget ownership
      if (widget.userId !== args.userId) {
        throw new Error("Access denied: You don't have permission to view this widget");
      }
    }
    
    return await ctx.db
      .query("artifacts")
      .withIndex("by_widget", (q) => q.eq("widgetId", args.widgetId))
      .order("desc")
      .collect();
  },
});

/**
 * Get single artifact by ID
 * ✅ FIX BLOCKER 4: Checks artifact ownership OR project collaborator access
 */
export const getArtifact = query({
  args: {
    artifactId: v.id("artifacts"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const artifact = await ctx.db.get(args.artifactId);
    if (!artifact) {
      throw new Error("Artifact not found");
    }
    
    // ✅ FIX BLOCKER 4: Check if user owns the artifact
    if (artifact.userId === args.userId) {
      return artifact;
    }
    
    // ✅ FIX BLOCKER 4: Check if user has access to the parent project
    if (artifact.projectId) {
      const permission = await ctx.runQuery(api.contentAccessHelpers.getUserContentPermission, {
        userId: args.userId,
        contentType: "project",
        contentId: artifact.projectId,
      });
      
      if (permission) {
        return artifact;  // User is a collaborator
      }
    }
    
    throw new Error("Access denied: You don't have permission to view this artifact");
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
 * Query artifacts by fingerprint (PHASE 2: Deduplication)
 * Finds existing artifacts with same content fingerprint
 */
export const getArtifactsByFingerprint = query({
  args: {
    fingerprint: v.string(),
    artifactType: artifactTypeValidator,
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // ✅ FIX BLOCKER 3: Check project permission
    const permission = await ctx.runQuery(api.contentAccessHelpers.getUserContentPermission, {
      userId: args.userId,
      contentType: "project",
      contentId: args.projectId,
    });
    
    if (!permission) {
      throw new Error("Access denied: You don't have permission to view this project");
    }
    
    // Query artifacts by fingerprint and type
    const artifacts = await ctx.db
      .query("artifacts")
      .withIndex("by_fingerprint", (q) => q.eq("fingerprint", args.fingerprint))
      .filter((q) => 
        q.and(
          q.eq(q.field("type"), args.artifactType),
          q.eq(q.field("projectId"), args.projectId)
        )
      )
      .collect();
    
    return artifacts;
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
      
      // ✅ FIX BLOCKER 3: Check widget/project permission
      // Cast widgetId to Id<"widgets"> to properly narrow the return type
      const widget = await ctx.db.get(widgetId as Id<"widgets">);
      if (!widget) {
        throw new Error("Widget not found");
      }
      
      if (widget.projectId) {
        const permission = await ctx.runQuery(api.contentAccessHelpers.getUserContentPermission, {
          userId: args.userId,
          contentType: "project",
          contentId: widget.projectId,
        });
        
        if (!permission) {
          throw new Error("Access denied: You don't have permission to view this project");
        }
      } else {
        if (widget.userId !== args.userId) {
          throw new Error("Access denied: You don't have permission to view this widget");
        }
      }
      
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
      
      // ✅ FIX BLOCKER 3: Check project permission
      const permission = await ctx.runQuery(api.contentAccessHelpers.getUserContentPermission, {
        userId: args.userId,
        contentType: "project",
        contentId: projectId,
      });
      
      if (!permission) {
        throw new Error("Access denied: You don't have permission to view this project");
      }
      
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

