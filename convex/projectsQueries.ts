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

      console.log("Project data for getProjectDetails:", {
        projectId: project._id,
        noteIds: project.noteIds,
        conversationIds: project.conversationIds,
        instagramPostIds: project.instagramPostIds,
        youtubeVideoIds: project.youtubeVideoIds,
        gmailIds: project.gmailIds,
        analysisIds: project.analysisIds,
      });

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

      // Batch fetch Instagram posts using external IDs
      const instagramPosts = [];
      if (project.instagramPostIds && project.instagramPostIds.length > 0) {
        console.log("Fetching Instagram posts with IDs:", project.instagramPostIds);
        const instagramPromises = project.instagramPostIds.map(async (postId) => {
          console.log("Looking for Instagram post with ID:", postId);
          
          // Try to find the post by postId field using the index
          const posts = await ctx.db
            .query("instagramPosts")
            .withIndex("by_postId", (q) => q.eq("postId", postId))
            .filter((q) => q.eq(q.field("userId"), project.userId))
            .collect();
          
          console.log("Instagram query result:", { postId, found: posts.length > 0 });
          return posts.length > 0 ? posts[0] : null;
        });
        const instagramResults = await Promise.all(instagramPromises);
        instagramPosts.push(...instagramResults.filter(Boolean));
        console.log("Final Instagram posts found:", instagramPosts.length);
      }

      // Batch fetch YouTube videos using external IDs
      const youtubeVideos = [];
      if (project.youtubeVideoIds && project.youtubeVideoIds.length > 0) {
        console.log("Fetching YouTube videos with IDs:", project.youtubeVideoIds);
        const youtubePromises = project.youtubeVideoIds.map(async (videoId) => {
          console.log("Looking for YouTube video with ID:", videoId);
          
          // Try to find the video by videoId field using the index
          const videos = await ctx.db
            .query("youtubeVideos")
            .withIndex("by_videoId", (q) => q.eq("videoId", videoId))
            .filter((q) => q.eq(q.field("userId"), project.userId))
            .collect();
          
          console.log("YouTube query result:", { videoId, found: videos.length > 0 });
          return videos.length > 0 ? videos[0] : null;
        });
        const youtubeResults = await Promise.all(youtubePromises);
        youtubeVideos.push(...youtubeResults.filter(Boolean));
        console.log("Final YouTube videos found:", youtubeVideos.length);
      }

      // Batch fetch Gmail items using external IDs
      const gmailItems = [];
      if (project.gmailIds && project.gmailIds.length > 0) {
        console.log("Fetching Gmail items with IDs:", project.gmailIds);
        const gmailPromises = project.gmailIds.map(async (gmailId) => {
          console.log("Looking for Gmail thread with ID:", gmailId);
          
          // Try to find the thread by threadId field using the index
          const threads = await ctx.db
            .query("gmailThreads")
            .withIndex("by_threadId", (q) => q.eq("threadId", gmailId))
            .filter((q) => q.eq(q.field("userId"), project.userId))
            .collect();
          
          console.log("Gmail query result:", { gmailId, found: threads.length > 0 });
          if (threads.length > 0 && typeof threads[0] === 'object') {
            return { ...threads[0], gmailType: "thread" as const };
          }
          return null;
        });
        const gmailResults = await Promise.all(gmailPromises);
        gmailItems.push(...gmailResults.filter(Boolean));
        console.log("Final Gmail items found:", gmailItems.length);
      }

      // Batch fetch analysis items (handle both unified and raw IDs)
      const analysisItems = [];
      if (project.analysisIds && project.analysisIds.length > 0) {
        console.log("Fetching analysis items with IDs:", project.analysisIds);
        const analysisPromises = project.analysisIds.map(async (analysisId) => {
          console.log("Processing analysis ID:", analysisId);
          
          // Analysis IDs are in format: platform:analysisId:index
          // For example: "instagram:abc123:0" or "youtube:def456:1"
          const parts = analysisId.split(':');
          if (parts.length !== 3) {
            console.log("Invalid analysis ID format:", analysisId);
            return null;
          }
          
          const [platform, analysisDocId, indexStr] = parts;
          const index = parseInt(indexStr, 10);
          
          if (isNaN(index)) {
            console.log("Invalid analysis index:", indexStr);
            return null;
          }
          
          console.log("Parsed analysis ID:", { platform, analysisDocId, index });
          
          // Try to get the analysis document based on platform
          let analysis = null;
          let analysisType = null;
          
          if (platform === 'instagram') {
            analysis = await ctx.db.get(analysisDocId as Id<"instagramBatchAnalysis">);
            analysisType = "instagram";
          } else if (platform === 'youtube') {
            analysis = await ctx.db.get(analysisDocId as Id<"youtubeBatchAnalysis">);
            analysisType = "youtube";
          } else if (platform === 'gmail') {
            analysis = await ctx.db.get(analysisDocId as Id<"gmailBatchAnalysis">);
            analysisType = "gmail";
          }
          
          if (!analysis || analysis.userId !== project.userId) {
            console.log("Analysis not found or access denied:", { analysisDocId, platform, found: !!analysis });
            return null;
          }
          
          // Extract the specific insight at the given index
          const insights = analysis.insights?.insights;
          if (!insights || !Array.isArray(insights) || !insights[index]) {
            console.log("Insight not found at index:", { index, insightsLength: insights?.length });
            return null;
          }
          
          const insight = insights[index];
          console.log("Found analysis insight:", { platform, analysisType, insightTitle: insight.title });
          
          return {
            _id: analysisId, // Use the full analysis ID as the document ID
            _creationTime: analysis.createdAt || Date.now(),
            userId: project.userId,
            platform: platform,
            analysisType: analysisType,
            insight: insight,
            analysis: analysis,
            title: insight.title || `${platform} Analysis`,
            createdAt: analysis.createdAt || Date.now(),
            updatedAt: analysis.updatedAt || Date.now(),
          };
        });
        const analysisResults = await Promise.all(analysisPromises);
        analysisItems.push(...analysisResults.filter(Boolean));
        console.log("Final analysis items found:", analysisItems.length);
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