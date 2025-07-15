import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper to extract raw Convex document ID from a unified content ID
function extractRawId(unifiedId: string): string {
  if (!unifiedId || typeof unifiedId !== 'string' || unifiedId.trim() === '') {
    throw new Error("Invalid item ID provided");
  }
  
  const trimmedId = unifiedId.trim();
  
  if (trimmedId.includes(':')) {
    const parts = trimmedId.split(':');
    const rawId = parts[parts.length - 1];
    if (!rawId || rawId.trim() === '') {
      throw new Error("Invalid item ID format - empty ID part");
    }
    return rawId.trim();
  }
  
  return trimmedId;
}

// Helper to validate project ownership
async function validateProjectOwnership(ctx: any, projectId: Id<"projects">, userId?: string) {
  const project = await ctx.db.get(projectId);
  if (!project) {
    throw new Error("Project not found");
  }
  
  // Optional: Validate ownership if userId is provided
  if (userId && project.userId !== userId) {
    throw new Error("Access denied: You don't own this project");
  }
  
  return project;
}

// Create a new project
export const createProject = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    // Validate inputs
    if (!args.userId || args.userId.trim() === '') {
      throw new Error("Valid user ID is required");
    }
    
    if (!args.name || args.name.trim() === '') {
      throw new Error("Project name is required");
    }
    
    // Sanitize and validate name length
    const sanitizedName = args.name.trim();
    if (sanitizedName.length > 100) {
      throw new Error("Project name must be 100 characters or less");
    }
    
    // Sanitize description if provided
    const sanitizedDescription = args.description?.trim() || undefined;
    if (sanitizedDescription && sanitizedDescription.length > 500) {
      throw new Error("Project description must be 500 characters or less");
    }
    
    const now = Date.now();
    
    try {
      const projectId = await ctx.db.insert("projects", {
        userId: args.userId,
        name: sanitizedName,
        description: sanitizedDescription,
        noteIds: [],
        conversationIds: [],
        instagramPostIds: [],
        youtubeVideoIds: [],
        gmailIds: [],
        analysisIds: [],
        createdAt: now,
        updatedAt: now,
      });

      return projectId;
    } catch (error) {
      console.error("Failed to create project:", error);
      throw new Error("Failed to create project. Please try again.");
    }
  },
});

// Update a project
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.string()), // For ownership validation
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const project = await validateProjectOwnership(ctx, args.projectId, args.userId);

    const updates: any = {
      updatedAt: Date.now(),
    };

    // Validate and sanitize name if provided
    if (args.name !== undefined) {
      const sanitizedName = args.name.trim();
      if (sanitizedName === '') {
        throw new Error("Project name cannot be empty");
      }
      if (sanitizedName.length > 100) {
        throw new Error("Project name must be 100 characters or less");
      }
      updates.name = sanitizedName;
    }
    
    // Validate and sanitize description if provided
    if (args.description !== undefined) {
      const sanitizedDescription = args.description.trim();
      if (sanitizedDescription.length > 500) {
        throw new Error("Project description must be 500 characters or less");
      }
      updates.description = sanitizedDescription || undefined;
    }

    try {
      await ctx.db.patch(args.projectId, updates);
      return args.projectId;
    } catch (error) {
      console.error("Failed to update project:", error);
      throw new Error("Failed to update project. Please try again.");
    }
  },
});

// Delete a project
export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.string()), // For ownership validation
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await validateProjectOwnership(ctx, args.projectId, args.userId);

    try {
      await ctx.db.delete(args.projectId);
      return true;
    } catch (error) {
      console.error("Failed to delete project:", error);
      throw new Error("Failed to delete project. Please try again.");
    }
  },
});

// Add an item to a project
export const addItemToProject = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.string()), // For ownership validation
    itemType: v.union(
      v.literal("note"),
      v.literal("conversation"),
      v.literal("instagramPost"),
      v.literal("youtubeVideo"),
      v.literal("gmail"),
      v.literal("analysis")
    ),
    itemId: v.string(),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const project = await validateProjectOwnership(ctx, args.projectId, args.userId);

    // For analysis items, use the full ID; for others, extract the raw database ID
    let rawId: string;
    try {
      rawId = args.itemType === 'analysis' ? args.itemId : extractRawId(args.itemId);
    } catch (error) {
      throw new Error(`Invalid item ID: ${error.message}`);
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    try {
      switch (args.itemType) {
        case "note": {
          const noteIds = project.noteIds || [];
          if (!noteIds.includes(rawId)) {
            // Verify the note exists and belongs to the user (if userId provided)
            if (args.userId) {
              const note = await ctx.db.get(rawId as Id<"notes">);
              if (!note) {
                throw new Error("Note not found");
              }
              if (note.userId !== args.userId) {
                throw new Error("Access denied: You don't own this note");
              }
            }
            updates.noteIds = [...noteIds, rawId];
          }
          break;
        }
        case "conversation": {
          const conversationIds = project.conversationIds || [];
          if (!conversationIds.includes(rawId)) {
            // Verify the conversation exists and belongs to the user
            if (args.userId) {
              const conversation = await ctx.db.get(rawId as Id<"conversations">);
              if (!conversation) {
                throw new Error("Conversation not found");
              }
              if (conversation.userId !== args.userId) {
                throw new Error("Access denied: You don't own this conversation");
              }
            }
            updates.conversationIds = [...conversationIds, rawId];
          }
          break;
        }
        case "instagramPost": {
          const instagramPostIds = project.instagramPostIds || [];
          if (!instagramPostIds.includes(rawId)) {
            // Verify the post exists and belongs to the user
            if (args.userId) {
              const post = await ctx.db.get(rawId as Id<"instagramPosts">);
              if (!post) {
                throw new Error("Instagram post not found");
              }
              if (post.userId !== args.userId) {
                throw new Error("Access denied: You don't own this Instagram post");
              }
            }
            updates.instagramPostIds = [...instagramPostIds, rawId];
          }
          break;
        }
        case "youtubeVideo": {
          const youtubeVideoIds = project.youtubeVideoIds || [];
          if (!youtubeVideoIds.includes(rawId)) {
            // Verify the video exists and belongs to the user
            if (args.userId) {
              const video = await ctx.db.get(rawId as Id<"youtubeVideos">);
              if (!video) {
                throw new Error("YouTube video not found");
              }
              if (video.userId !== args.userId) {
                throw new Error("Access denied: You don't own this YouTube video");
              }
            }
            updates.youtubeVideoIds = [...youtubeVideoIds, rawId];
          }
          break;
        }
        case "gmail": {
          const gmailIds = project.gmailIds || [];
          if (!gmailIds.includes(rawId)) {
            // Verify the gmail item exists and belongs to the user
            if (args.userId) {
              // Try both threads and messages
              let gmailItem = null;
              try {
                gmailItem = await ctx.db.get(rawId as Id<"gmailThreads">);
              } catch {
                try {
                  gmailItem = await ctx.db.get(rawId as Id<"gmailMessages">);
                } catch {}
              }
              
              if (!gmailItem) {
                throw new Error("Gmail item not found");
              }
              if (gmailItem.userId !== args.userId) {
                throw new Error("Access denied: You don't own this Gmail item");
              }
            }
            updates.gmailIds = [...gmailIds, rawId];
          }
          break;
        }
        case "analysis": {
          const analysisIds = project.analysisIds || [];
          if (!analysisIds.includes(rawId)) {
            // For analysis items, we store the full synthetic ID (e.g., "insight:youtube:abc123:0")
            // rather than trying to validate it as a database document ID
            if (args.userId) {
              // The rawId for analysis items is the full insight ID
              // We don't validate against database since insights are computed content
              // The user ownership is validated by the underlying content when insights are generated
              console.log(`Adding analysis item to project: ${rawId}`);
            }
            updates.analysisIds = [...analysisIds, rawId];
          }
          break;
        }
        default: {
          throw new Error(`Unsupported item type: ${args.itemType}`);
        }
      }

      await ctx.db.patch(args.projectId, updates);
      return args.projectId;
    } catch (error) {
      console.error("Failed to add item to project:", error);
      if (error.message.includes("Access denied") || error.message.includes("not found")) {
        throw error; // Re-throw validation errors as-is
      }
      throw new Error("Failed to add item to project. Please try again.");
    }
  },
});

// Remove an item from a project
export const removeItemFromProject = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.string()), // For ownership validation
    itemType: v.union(
      v.literal("note"),
      v.literal("conversation"),
      v.literal("instagramPost"),
      v.literal("youtubeVideo"),
      v.literal("gmail"),
      v.literal("analysis")
    ),
    itemId: v.string(),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const project = await validateProjectOwnership(ctx, args.projectId, args.userId);

    // Validate the item ID
    if (!args.itemId || typeof args.itemId !== 'string') {
      throw new Error("Valid item ID is required");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    try {
      switch (args.itemType) {
        case "note": {
          const noteIds = project.noteIds || [];
          updates.noteIds = noteIds.filter(id => id !== args.itemId);
          break;
        }
        case "conversation": {
          const conversationIds = project.conversationIds || [];
          updates.conversationIds = conversationIds.filter(id => id !== args.itemId);
          break;
        }
        case "instagramPost": {
          const instagramPostIds = project.instagramPostIds || [];
          updates.instagramPostIds = instagramPostIds.filter(id => id !== args.itemId);
          break;
        }
        case "youtubeVideo": {
          const youtubeVideoIds = project.youtubeVideoIds || [];
          updates.youtubeVideoIds = youtubeVideoIds.filter(id => id !== args.itemId);
          break;
        }
        case "gmail": {
          const gmailIds = project.gmailIds || [];
          updates.gmailIds = gmailIds.filter(id => id !== args.itemId);
          break;
        }
        case "analysis": {
          const analysisIds = project.analysisIds || [];
          updates.analysisIds = analysisIds.filter(id => id !== args.itemId);
          break;
        }
        default: {
          throw new Error(`Unsupported item type: ${args.itemType}`);
        }
      }

      await ctx.db.patch(args.projectId, updates);
      return args.projectId;
    } catch (error) {
      console.error("Failed to remove item from project:", error);
      throw new Error("Failed to remove item from project. Please try again.");
    }
  },
}); 