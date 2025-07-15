import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper to extract raw Convex document ID from a unified content ID
function extractRawId(unifiedId: string): string {
  if (!unifiedId || typeof unifiedId !== 'string') {
    return unifiedId; // Return as-is if invalid, let the caller handle
  }
  
  if (unifiedId.includes(':')) {
    const parts = unifiedId.split(':');
    return parts[parts.length - 1];
  }
  return unifiedId;
}

// Helper to safely fetch and validate item existence
async function safeGet<T>(ctx: any, id: string, table: string): Promise<T | null> {
  try {
    return await ctx.db.get(id as Id<any>);
  } catch (error) {
    console.warn(`Failed to fetch ${table} item ${id}:`, error);
    return null;
  }
}

// Get all projects for a user
export const getProjectsForUser = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("projects"),
    _creationTime: v.number(),
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    noteIds: v.optional(v.array(v.string())),
    conversationIds: v.optional(v.array(v.string())),
    instagramPostIds: v.optional(v.array(v.string())),
    youtubeVideoIds: v.optional(v.array(v.string())),
    gmailIds: v.optional(v.array(v.string())),
    analysisIds: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    // Validate user ID
    if (!args.userId || args.userId.trim() === '') {
      throw new Error("Valid user ID is required");
    }

    try {
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();

      return projects.map(project => ({
        ...project,
        // Ensure all arrays are defined for consistent frontend handling
        noteIds: project.noteIds || [],
        conversationIds: project.conversationIds || [],
        instagramPostIds: project.instagramPostIds || [],
        youtubeVideoIds: project.youtubeVideoIds || [],
        gmailIds: project.gmailIds || [],
        analysisIds: project.analysisIds || [],
      }));
    } catch (error) {
      console.error("Failed to fetch projects for user:", error);
      throw new Error("Failed to fetch projects. Please try again.");
    }
  },
});

// Get project details with all attached items
export const getProjectDetails = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.string()), // For ownership validation
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("projects"),
      _creationTime: v.number(),
      userId: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      noteIds: v.optional(v.array(v.string())),
      conversationIds: v.optional(v.array(v.string())),
      instagramPostIds: v.optional(v.array(v.string())),
      youtubeVideoIds: v.optional(v.array(v.string())),
      gmailIds: v.optional(v.array(v.string())),
      analysisIds: v.optional(v.array(v.string())),
      createdAt: v.number(),
      updatedAt: v.number(),
      attachedItems: v.object({
        notes: v.array(v.any()),
        conversations: v.array(v.any()),
        instagramPosts: v.array(v.any()),
        youtubeVideos: v.array(v.any()),
        gmailItems: v.array(v.any()),
        analysisItems: v.array(v.any()),
      }),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const project = await ctx.db.get(args.projectId);
      if (!project) {
        return null;
      }

      // Optional: Validate ownership if userId is provided
      if (args.userId && project.userId !== args.userId) {
        throw new Error("Access denied: You don't own this project");
      }

      // Batch fetch all attached notes with error handling
      const notes = [];
      if (project.noteIds && project.noteIds.length > 0) {
        const notePromises = project.noteIds.map(async (noteId) => {
          return await safeGet(ctx, noteId, "notes");
        });
        const noteResults = await Promise.all(notePromises);
        notes.push(...noteResults.filter(Boolean));
      }

      // Batch fetch conversations with error handling
      const conversations = [];
      if (project.conversationIds && project.conversationIds.length > 0) {
        const conversationPromises = project.conversationIds.map(async (conversationId) => {
          return await safeGet(ctx, conversationId, "conversations");
        });
        const conversationResults = await Promise.all(conversationPromises);
        conversations.push(...conversationResults.filter(Boolean));
      }

      // Batch fetch Instagram posts (handle both unified and raw IDs)
      const instagramPosts = [];
      if (project.instagramPostIds && project.instagramPostIds.length > 0) {
        const instagramPromises = project.instagramPostIds.map(async (postId) => {
          const rawId = extractRawId(postId);
          return await safeGet(ctx, rawId, "instagramPosts");
        });
        const instagramResults = await Promise.all(instagramPromises);
        instagramPosts.push(...instagramResults.filter(Boolean));
      }

      // Batch fetch YouTube videos (handle both unified and raw IDs)
      const youtubeVideos = [];
      if (project.youtubeVideoIds && project.youtubeVideoIds.length > 0) {
        const youtubePromises = project.youtubeVideoIds.map(async (videoId) => {
          const rawId = extractRawId(videoId);
          return await safeGet(ctx, rawId, "youtubeVideos");
        });
        const youtubeResults = await Promise.all(youtubePromises);
        youtubeVideos.push(...youtubeResults.filter(Boolean));
      }

      // Batch fetch Gmail items (handle both unified and raw IDs)
      const gmailItems = [];
      if (project.gmailIds && project.gmailIds.length > 0) {
        const gmailPromises = project.gmailIds.map(async (gmailId) => {
          const rawId = extractRawId(gmailId);
          const threadItem = await safeGet(ctx, rawId, "gmailThreads");
          if (threadItem && typeof threadItem === 'object') {
            return { ...threadItem, gmailType: "thread" as const };
          }
          return null;
        });
        const gmailResults = await Promise.all(gmailPromises);
        gmailItems.push(...gmailResults.filter(Boolean));
      }

      // Batch fetch analysis items (handle both unified and raw IDs)
      const analysisItems = [];
      if (project.analysisIds && project.analysisIds.length > 0) {
        const analysisPromises = project.analysisIds.map(async (analysisId) => {
          const rawId = extractRawId(analysisId);
          
          // Try different analysis tables systematically
          const analysisQueries = [
            { fn: () => safeGet(ctx, rawId, "instagramBatchAnalysis"), type: "instagram" },
            { fn: () => safeGet(ctx, rawId, "youtubeBatchAnalysis"), type: "youtube" },
            { fn: () => safeGet(ctx, rawId, "gmailBatchAnalysis"), type: "gmail" },
            { fn: () => safeGet(ctx, rawId, "instagramTrackerAnalysis"), type: "instagramTracker" },
          ];

          for (const { fn, type } of analysisQueries) {
            const analysis = await fn();
            if (analysis && typeof analysis === 'object') {
              return { ...analysis, analysisType: type };
            }
          }
          
          return null;
        });
        const analysisResults = await Promise.all(analysisPromises);
        analysisItems.push(...analysisResults.filter(Boolean));
      }

      return {
        ...project,
        // Ensure all arrays are defined
        noteIds: project.noteIds || [],
        conversationIds: project.conversationIds || [],
        instagramPostIds: project.instagramPostIds || [],
        youtubeVideoIds: project.youtubeVideoIds || [],
        gmailIds: project.gmailIds || [],
        analysisIds: project.analysisIds || [],
        attachedItems: {
          notes,
          conversations,
          instagramPosts,
          youtubeVideos,
          gmailItems,
          analysisItems,
        },
      };
    } catch (error) {
      console.error("Failed to fetch project details:", error);
      if (error.message.includes("Access denied")) {
        throw error; // Re-throw access control errors
      }
      throw new Error("Failed to fetch project details. Please try again.");
    }
  },
});

// Get projects that contain a specific note
export const getProjectsContainingNote = query({
  args: {
    userId: v.string(),
    noteId: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("projects"),
    _creationTime: v.number(),
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    noteIds: v.optional(v.array(v.string())),
    conversationIds: v.optional(v.array(v.string())),
    instagramPostIds: v.optional(v.array(v.string())),
    youtubeVideoIds: v.optional(v.array(v.string())),
    gmailIds: v.optional(v.array(v.string())),
    analysisIds: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    // Validate inputs
    if (!args.userId || args.userId.trim() === '') {
      throw new Error("Valid user ID is required");
    }
    
    if (!args.noteId || args.noteId.trim() === '') {
      throw new Error("Valid note ID is required");
    }

    try {
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      const containingProjects = projects.filter(project => {
        const noteIds = project.noteIds || [];
        return noteIds.includes(args.noteId);
      });

      return containingProjects.map(project => ({
        ...project,
        // Ensure all arrays are defined
        noteIds: project.noteIds || [],
        conversationIds: project.conversationIds || [],
        instagramPostIds: project.instagramPostIds || [],
        youtubeVideoIds: project.youtubeVideoIds || [],
        gmailIds: project.gmailIds || [],
        analysisIds: project.analysisIds || [],
      }));
    } catch (error) {
      console.error("Failed to fetch projects containing note:", error);
      throw new Error("Failed to fetch projects. Please try again.");
    }
  },
});

// Get projects that contain a specific item (generic version)
export const getProjectsContainingItem = query({
  args: {
    userId: v.string(),
    itemId: v.string(),
    itemType: v.union(
      v.literal("note"),
      v.literal("conversation"),
      v.literal("instagramPost"),
      v.literal("youtubeVideo"),
      v.literal("gmail"),
      v.literal("analysis")
    ),
  },
  returns: v.array(v.object({
    _id: v.id("projects"),
    _creationTime: v.number(),
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    noteIds: v.optional(v.array(v.string())),
    conversationIds: v.optional(v.array(v.string())),
    instagramPostIds: v.optional(v.array(v.string())),
    youtubeVideoIds: v.optional(v.array(v.string())),
    gmailIds: v.optional(v.array(v.string())),
    analysisIds: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    // Validate inputs
    if (!args.userId || args.userId.trim() === '') {
      throw new Error("Valid user ID is required");
    }
    
    if (!args.itemId || args.itemId.trim() === '') {
      throw new Error("Valid item ID is required");
    }

    try {
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      const containingProjects = projects.filter(project => {
        let itemIds: string[] = [];
        
        switch (args.itemType) {
          case "note":
            itemIds = project.noteIds || [];
            break;
          case "conversation":
            itemIds = project.conversationIds || [];
            break;
          case "instagramPost":
            itemIds = project.instagramPostIds || [];
            break;
          case "youtubeVideo":
            itemIds = project.youtubeVideoIds || [];
            break;
          case "gmail":
            itemIds = project.gmailIds || [];
            break;
          case "analysis":
            itemIds = project.analysisIds || [];
            break;
          default:
            return false;
        }
        
        return itemIds.includes(args.itemId);
      });

      return containingProjects.map(project => ({
        ...project,
        // Ensure all arrays are defined
        noteIds: project.noteIds || [],
        conversationIds: project.conversationIds || [],
        instagramPostIds: project.instagramPostIds || [],
        youtubeVideoIds: project.youtubeVideoIds || [],
        gmailIds: project.gmailIds || [],
        analysisIds: project.analysisIds || [],
      }));
    } catch (error) {
      console.error("Failed to fetch projects containing item:", error);
      throw new Error("Failed to fetch projects. Please try again.");
    }
  },
});

// Get project statistics (item counts)
export const getProjectStats = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.string()), // For ownership validation
  },
  returns: v.union(
    v.null(),
    v.object({
      totalItems: v.number(),
      noteCount: v.number(),
      conversationCount: v.number(),
      instagramPostCount: v.number(),
      youtubeVideoCount: v.number(),
      gmailCount: v.number(),
      analysisCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const project = await ctx.db.get(args.projectId);
      if (!project) {
        return null;
      }

      // Optional: Validate ownership if userId is provided
      if (args.userId && project.userId !== args.userId) {
        throw new Error("Access denied: You don't own this project");
      }

      const noteCount = (project.noteIds || []).length;
      const conversationCount = (project.conversationIds || []).length;
      const instagramPostCount = (project.instagramPostIds || []).length;
      const youtubeVideoCount = (project.youtubeVideoIds || []).length;
      const gmailCount = (project.gmailIds || []).length;
      const analysisCount = (project.analysisIds || []).length;

      return {
        totalItems: noteCount + conversationCount + instagramPostCount + youtubeVideoCount + gmailCount + analysisCount,
        noteCount,
        conversationCount,
        instagramPostCount,
        youtubeVideoCount,
        gmailCount,
        analysisCount,
      };
    } catch (error) {
      console.error("Failed to fetch project stats:", error);
      if (error.message.includes("Access denied")) {
        throw error;
      }
      throw new Error("Failed to fetch project statistics. Please try again.");
    }
  },
}); 