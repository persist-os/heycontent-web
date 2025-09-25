import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Optimized Projects Queries
 * Following Convex best practices for performance and scalability
 */

// ============================================================================
// PRIMARY QUERIES - Most commonly used
// ============================================================================

/**
 * Get project by ID - Primary access pattern
 * Used by: Frontend components, backend agents, fingerprint discovery
 */
export const getById = query({
  args: { 
    projectId: v.id("projects") 
  },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    
    if (!project) return null;

    // Return optimized data structure
    return {
      _id: project._id,
      userId: project.userId,
      name: project.name,
      description: project.description,
      
      // Content arrays with counts for performance
      noteIds: project.noteIds || [],
      noteCount: (project.noteIds || []).length,
      conversationIds: project.conversationIds || [],
      conversationCount: (project.conversationIds || []).length,
      crystalIds: project.crystalIds || [],
      crystalCount: (project.crystalIds || []).length,
      shardIds: project.shardIds || [],
      shardCount: (project.shardIds || []).length,
      
      // Analytics
      analysisIds: project.analysisIds || [],
      
      // Intelligence
      fingerprintId: project.fingerprintId,
      
      // Metadata
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  },
});

/**
 * Get projects by user ID - Primary user access pattern
 * Used by: Dashboard, project list, project selection
 */
export const getByUser = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc") // Most recent first
      .take(Math.min(limit, 100)); // Cap at 100 for performance

    // Return optimized list with summary data
    return projects.map(project => ({
      _id: project._id,
      userId: project.userId,
      name: project.name,
      description: project.description,
      
      // Summary counts for dashboard
      totalContent: (
        (project.noteIds || []).length +
        (project.conversationIds || []).length +
        (project.crystalIds || []).length +
        (project.shardIds || []).length
      ),
      noteCount: (project.noteIds || []).length,
      conversationCount: (project.conversationIds || []).length,
      crystalCount: (project.crystalIds || []).length,
      shardCount: (project.shardIds || []).length,
      
      // Intelligence status
      hasFingerprintId: !!project.fingerprintId,
      fingerprintId: project.fingerprintId,
      
      // Metadata
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));
  },
});

// ============================================================================
// CONTENT QUERIES - For project content management
// ============================================================================

/**
 * Get project with specific content type
 * Used by: Content filtering, type-specific views
 */
export const getWithContentType = query({
  args: { 
    projectId: v.id("projects"),
    contentType: v.union(
      v.literal("notes"),
      v.literal("conversations"), 
      v.literal("crystals"),
      v.literal("shards"),
      v.literal("all")
    ),
  },
  handler: async (ctx, { projectId, contentType }) => {
    const project = await ctx.db.get(projectId);
    
    if (!project) return null;

    // Base project data
    const result = {
      _id: project._id,
      userId: project.userId,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };

    // Add specific content type or all
    if (contentType === "all") {
      return {
        ...result,
        noteIds: project.noteIds || [],
        conversationIds: project.conversationIds || [],
        crystalIds: project.crystalIds || [],
        shardIds: project.shardIds || [],
        analysisIds: project.analysisIds || [],
      };
    } else {
      const fieldMap = {
        notes: "noteIds",
        conversations: "conversationIds", 
        crystals: "crystalIds",
        shards: "shardIds",
      };
      
      const field = fieldMap[contentType];
      return {
        ...result,
        [field]: project[field] || [],
      };
    }
  },
});

/**
 * Get projects with fingerprints - For intelligence dashboard
 * Used by: Analytics, fingerprint management
 */
export const getWithFingerprints = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 20 }) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.neq(q.field("fingerprintId"), undefined))
      .order("desc")
      .take(Math.min(limit, 50));

    return projects.map(project => ({
      _id: project._id,
      name: project.name,
      description: project.description,
      fingerprintId: project.fingerprintId,
      totalContent: (
        (project.noteIds || []).length +
        (project.conversationIds || []).length +
        (project.crystalIds || []).length +
        (project.shardIds || []).length
      ),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));
  },
});

// ============================================================================
// UTILITY QUERIES - For validation and checks
// ============================================================================

/**
 * Check if project exists and user has access
 * Used by: Authorization, validation
 */
export const exists = query({
  args: { 
    projectId: v.id("projects"),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, userId }) => {
    const project = await ctx.db.get(projectId);
    
    if (!project) return { exists: false };
    
    // Check ownership if userId provided
    if (userId && project.userId !== userId) {
      return { exists: true, hasAccess: false };
    }
    
    return { 
      exists: true, 
      hasAccess: true,
      name: project.name,
    };
  },
});

/**
 * Get recent projects - For quick access
 * Used by: Recent items, quick switcher
 */
export const getRecent = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc") // Most recent by updatedAt
      .take(Math.min(limit, 20));

    // Minimal data for quick access
    return projects.map(project => ({
      _id: project._id,
      name: project.name,
      description: project.description,
      updatedAt: project.updatedAt,
    }));
  },
});

/**
 * Search projects by name - For project discovery
 * Used by: Search, project selection
 */
export const searchByName = query({
  args: { 
    userId: v.string(),
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, searchTerm, limit = 20 }) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.or(
          q.eq(q.field("name"), searchTerm.toLowerCase()),
          q.eq(q.field("description"), searchTerm.toLowerCase())
        )
      )
      .take(Math.min(limit, 50));

    return projects.map(project => ({
      _id: project._id,
      name: project.name,
      description: project.description,
      totalContent: (
        (project.noteIds || []).length +
        (project.conversationIds || []).length +
        (project.crystalIds || []).length +
        (project.shardIds || []).length
      ),
      createdAt: project.createdAt,
    }));
  },
});

/**
 * Get project statistics - For analytics
 * Used by: Dashboard analytics, insights
 */
export const getStats = query({
  args: { 
    projectId: v.id("projects") 
  },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    
    if (!project) return null;

    return {
      projectId: project._id,
      name: project.name,
      
      // Content statistics
      stats: {
        notes: (project.noteIds || []).length,
        conversations: (project.conversationIds || []).length,
        crystals: (project.crystalIds || []).length,
        shards: (project.shardIds || []).length,
        analyses: (project.analysisIds || []).length,
        total: (
          (project.noteIds || []).length +
          (project.conversationIds || []).length +
          (project.crystalIds || []).length +
          (project.shardIds || []).length
        ),
      },
      
      // Intelligence status
      intelligence: {
        hasFingerprint: !!project.fingerprintId,
        fingerprintId: project.fingerprintId,
      },
      
      // Timeline
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      ageInDays: Math.floor((Date.now() - project.createdAt) / (1000 * 60 * 60 * 24)),
    };
  },
});