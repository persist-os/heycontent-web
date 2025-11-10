import { v } from "convex/values";
import { query, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Project Queries
 * 
 * Provides read access to project data with user ownership validation.
 * All queries return optimized data structures with computed counts.
 */

// Shared handler for retrieving project by ID with ownership validation
async function getProjectByIdHandler(
  ctx: QueryCtx,
  projectId: Id<"projects">,
  userId: string
) {
  const project = await ctx.db.get(projectId);
  
  if (!project || project.userId !== userId) {
    return null;
  }

  return {
    _id: project._id,
    userId: project.userId,
    name: project.name,
    description: project.description,
    
    // Content arrays with computed counts
    noteIds: project.noteIds || [],
    noteCount: (project.noteIds || []).length,
    conversationIds: project.conversationIds || [],
    conversationCount: (project.conversationIds || []).length,
    crystalIds: project.crystalIds || [],
    crystalCount: (project.crystalIds || []).length,
    shardIds: project.shardIds || [],
    shardCount: (project.shardIds || []).length,
    
    // Analytics
    stardustIds: project.stardustIds || [],
    stardustCount: (project.stardustIds || []).length,
    artifactIds: project.artifactIds || [],
    artifactCount: (project.artifactIds || []).length,
    
    // Intelligence
    fingerprintId: project.fingerprintId,
    
    // Constellation Layout
    constellationLayout: project.constellationLayout || null,
    
    // Metadata
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

/**
 * Retrieve project by ID with ownership validation
 * 
 * Returns complete project data including all content arrays and computed
 * counts. Optionally includes attached content items for constellation display.
 * Returns null if project doesn't exist or user doesn't own it.
 * 
 * @param projectId - Project ID to retrieve
 * @param userId - User ID for ownership validation
 * @param includeContent - Whether to fetch attached content items (default: false)
 * @returns Project data with optional content items or null if not found/unauthorized
 */
export const getById = query({
  args: { 
    projectId: v.id("projects"),
    userId: v.string(),
    includeContent: v.optional(v.boolean())
  },
  handler: async (ctx, { projectId, userId, includeContent = false }) => {
    const projectData = await getProjectByIdHandler(ctx, projectId, userId);
    if (!projectData) return null;

    if (!includeContent) {
      return projectData;
    }

    // Fetch attached content items with 60-item cap
    const contentItems: any[] = [];
    let totalFetched = 0;
    const maxItems = 60;

    // Priority order: widgets → notes → artifacts → stardust → shards
    // (Widgets are handled separately, so start with notes)

    // Fetch notes (up to 20)
    const noteLimit = Math.min(20, maxItems - totalFetched);
    if (noteLimit > 0 && projectData.noteIds.length > 0) {
      const noteIds = projectData.noteIds.slice(0, noteLimit);
      console.log('Fetching notes with IDs:', noteIds);
      for (const noteId of noteIds) {
        try {
          const note = await ctx.db.get(noteId as any);
          console.log(`Note ${noteId} found:`, !!note);
          if (note) {
            contentItems.push({
              ...note,
              _contentType: 'note' as const,
              _contentId: noteId
            });
            totalFetched++;
          }
        } catch (error) {
          console.warn(`Failed to fetch note ${noteId}:`, error);
        }
      }
    }

    // Fetch artifacts (up to 15)
    const artifactLimit = Math.min(15, maxItems - totalFetched);
    if (artifactLimit > 0 && projectData.artifactIds?.length > 0) {
      const artifactIds = projectData.artifactIds.slice(0, artifactLimit);
      console.log('Fetching artifacts with IDs:', artifactIds);
      for (const artifactId of artifactIds) {
        try {
          const artifact = await ctx.db.get(artifactId as Id<"artifacts">);
          console.log(`Artifact ${artifactId} found:`, !!artifact);
          if (artifact) {
            contentItems.push({
              ...artifact,
              _contentType: 'artifact' as const,
              _contentId: artifactId
            });
            totalFetched++;
          }
        } catch (error) {
          console.warn(`Failed to fetch artifact ${artifactId}:`, error);
        }
      }
    }

    // Fetch stardust (up to 15)
    const stardustLimit = Math.min(15, maxItems - totalFetched);
    if (stardustLimit > 0 && projectData.stardustIds?.length > 0) {
      const stardustIds = projectData.stardustIds.slice(0, stardustLimit);
      console.log('Fetching stardust with IDs:', stardustIds);
      for (const stardustId of stardustIds) {
        try {
          const stardust = await ctx.db.get(stardustId as Id<"stardust">);
          console.log(`Stardust ${stardustId} found:`, !!stardust);
          if (stardust) {
            contentItems.push({
              ...stardust,
              _contentType: 'stardust' as const,
              _contentId: stardustId
            });
            totalFetched++;
          }
        } catch (error) {
          console.warn(`Failed to fetch stardust ${stardustId}:`, error);
        }
      }
    }

    // Fetch shards (up to 15)
    const shardLimit = Math.min(15, maxItems - totalFetched);
    if (shardLimit > 0 && projectData.shardIds.length > 0) {
      const shardIds = projectData.shardIds.slice(0, shardLimit);
      console.log('Fetching shards with IDs:', shardIds);
      for (const shardId of shardIds) {
        try {
          const shard = await ctx.db.get(shardId as any);
          console.log(`Shard ${shardId} found:`, !!shard);
          if (shard) {
            contentItems.push({
              ...shard,
              _contentType: 'shard' as const,
              _contentId: shardId
            });
            totalFetched++;
          }
        } catch (error) {
          console.warn(`Failed to fetch shard ${shardId}:`, error);
        }
      }
    }

    console.log(`Total content items fetched: ${contentItems.length}`, contentItems.map(item => ({ type: item._contentType, id: item._contentId })));
    
    return {
      ...projectData,
      contentItems
    };
  },
});

/**
 * Retrieve project details (alias for getById)
 * 
 * Legacy endpoint maintained for backward compatibility.
 * Identical to getById - returns complete project data with validation.
 */
export const getProjectDetails = query({
  args: { 
    projectId: v.id("projects"),
    userId: v.string()
  },
  handler: async (ctx, { projectId, userId }) => {
    return await getProjectByIdHandler(ctx, projectId, userId);
  },
});

/**
 * Retrieve all projects for a user
 * 
 * Returns user's projects with summary data and content counts,
 * ordered by most recent first. Results are limited for performance.
 * 
 * @param userId - User ID to retrieve projects for
 * @param limit - Maximum number of projects to return (capped at 100)
 * @returns Array of project summaries with content counts
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
      
      // Living Projects Status
      status: project.status,
      
      // Summary counts for dashboard
      totalContent: (
        (project.noteIds || []).length +
        (project.conversationIds || []).length +
        (project.crystalIds || []).length +
        (project.shardIds || []).length +
        (project.stardustIds || []).length
      ),
      noteCount: (project.noteIds || []).length,
      conversationCount: (project.conversationIds || []).length,
      crystalCount: (project.crystalIds || []).length,
      shardCount: (project.shardIds || []).length,
      stardustCount: (project.stardustIds || []).length,
      
      // Intelligence status
      hasFingerprintId: !!project.fingerprintId,
      fingerprintId: project.fingerprintId,
      
      // Metadata
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));
  },
});

/**
 * Get ALL projects for a user without limits - for deletion operations
 * 
 * This query fetches all projects for a user without any limits.
 * Used specifically for deletion operations where we need to delete everything.
 * 
 * @param userId - User ID to fetch projects for
 * @returns Array of all project objects for the user
 */
export const getAllByUser = query({
  args: { 
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    return projects;
  },
});

/**
 * Retrieve project with filtered content type
 * 
 * Returns project data with only the specified content type populated,
 * or all content if "all" is specified. Useful for reducing payload size
 * when only specific content is needed.
 * 
 * @param projectId - Project ID to retrieve
 * @param contentType - Type of content to include (notes, conversations, crystals, shards, all)
 * @returns Project data with requested content type(s)
 */
export const getWithContentType = query({
  args: { 
    projectId: v.id("projects"),
    contentType: v.union(
      v.literal("notes"),
      v.literal("conversations"), 
      v.literal("crystals"),
      v.literal("shards"),
      v.literal("stardust"),
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
        stardustIds: project.stardustIds || [],
      };
    } else {
      const fieldMap = {
        notes: "noteIds",
        conversations: "conversationIds",
        crystals: "crystalIds",
        shards: "shardIds",
        stardust: "stardustIds",
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
 * Retrieve user's projects that have fingerprints
 * 
 * Returns only projects with linked intelligence fingerprints,
 * useful for analytics and intelligence dashboards.
 * 
 * @param userId - User ID to retrieve projects for
 * @param limit - Maximum number of projects to return (capped at 50)
 * @returns Array of projects with fingerprints
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
        (project.shardIds || []).length +
        (project.stardustIds || []).length
      ),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));
  },
});

/**
 * Check project existence and access permissions
 * 
 * Validates whether a project exists and optionally checks user ownership.
 * Lightweight query for authorization without fetching full project data.
 * 
 * @param projectId - Project ID to check
 * @param userId - Optional user ID for ownership validation
 * @returns Existence status, access status, and project name if accessible
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
 * Retrieve user's recently updated projects
 * 
 * Returns minimal project data sorted by last update time,
 * optimized for quick access menus and project switchers.
 * 
 * @param userId - User ID to retrieve projects for
 * @param limit - Maximum number of projects to return (capped at 20)
 * @returns Array of recent projects with minimal data
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
 * Search user's projects by name or description
 * 
 * Performs exact match search on project name and description fields.
 * Returns matching projects with summary statistics.
 * 
 * @param userId - User ID to search within
 * @param searchTerm - Term to search for (case-insensitive)
 * @param limit - Maximum number of results (capped at 50)
 * @returns Array of matching projects
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
        (project.shardIds || []).length +
        (project.stardustIds || []).length
      ),
      createdAt: project.createdAt,
    }));
  },
});

/**
 * Retrieve comprehensive project statistics
 * 
 * Returns detailed analytics including content counts, intelligence status,
 * and timeline information. Useful for dashboards and analytics views.
 * 
 * @param projectId - Project ID to get statistics for
 * @returns Detailed statistics object or null if project not found
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
        stardusts: (project.stardustIds || []).length,
        total: (
          (project.noteIds || []).length +
          (project.conversationIds || []).length +
          (project.crystalIds || []).length +
          (project.shardIds || []).length +
          (project.stardustIds || []).length
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