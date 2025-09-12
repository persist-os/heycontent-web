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
  console.log("validateProjectOwnership called with projectId:", projectId, "userId:", userId);
  
  try {
    const project = await ctx.db.get(projectId);
    console.log("Project from database:", project);
    
    if (!project) {
      throw new Error("Project not found");
    }
    
    // Optional: Validate ownership if userId is provided
    if (userId && project.userId !== userId) {
      throw new Error("Access denied: You don't own this project");
    }
    
    return project;
  } catch (error) {
    console.error("Error in validateProjectOwnership:", error);
    throw error;
  }
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
    console.log("addItemToProject called with args:", args);
    
    try {
      const project = await validateProjectOwnership(ctx, args.projectId, args.userId);
      console.log("Project found:", project);

      const rawId = args.itemId;
      console.log("Raw ID:", rawId);

      const updates: any = {
        updatedAt: Date.now(),
      };
      
      console.log("Processing itemType:", args.itemType);
      
      // Check if this is an analysis item that was incorrectly stored as an Instagram post
      if (args.itemType === "instagramPost" && rawId.includes(':')) {
        const parts = rawId.split(':');
        if (parts.length === 3) {
          const [platform, analysisId, indexStr] = parts;
          const index = parseInt(indexStr, 10);
          
          // If this looks like an analysis item (has platform:analysisId:index format)
          if (!isNaN(index) && ['instagram', 'youtube', 'gmail'].includes(platform)) {
            console.log("Detected analysis item incorrectly stored as Instagram post:", rawId);
            
            // Move it to the analysis array instead
            const analysisIds = project.analysisIds || [];
            if (!analysisIds.includes(rawId)) {
              updates.analysisIds = [...analysisIds, rawId];
            }
            
            // Remove it from Instagram posts if it exists there
            const instagramPostIds = project.instagramPostIds || [];
            const filteredInstagramIds = instagramPostIds.filter(id => id !== rawId);
            if (filteredInstagramIds.length !== instagramPostIds.length) {
              updates.instagramPostIds = filteredInstagramIds;
            }
            
            console.log("Moved analysis item to correct array");
            
            // Only update if there are actual changes
            if (Object.keys(updates).length > 1) { // More than just updatedAt
              await ctx.db.patch(args.projectId, updates);
              console.log("Successfully patched project");
            }
            
            return args.projectId;
          }
        }
      }
      
      // Regular logic for other item types
      switch (args.itemType) {
        case "note": {
          console.log("Processing note case");
          const noteIds = project.noteIds || [];
          if (!noteIds.includes(rawId)) {
            updates.noteIds = [...noteIds, rawId];
          }
          break;
        }
        case "conversation": {
          console.log("Processing conversation case");
          const conversationIds = project.conversationIds || [];
          if (!conversationIds.includes(rawId)) {
            updates.conversationIds = [...conversationIds, rawId];
          }
          break;
        }
        case "instagramPost": {
          const instagramPostIds = project.instagramPostIds || [];
          if (!instagramPostIds.includes(rawId)) {
            updates.instagramPostIds = [...instagramPostIds, rawId];
          }
          break;
        }
        case "youtubeVideo": {
          const youtubeVideoIds = project.youtubeVideoIds || [];
          if (!youtubeVideoIds.includes(rawId)) {
            updates.youtubeVideoIds = [...youtubeVideoIds, rawId];
          }
          break;
        }
        case "gmail": {
          const gmailIds = project.gmailIds || [];
          if (!gmailIds.includes(rawId)) {
            updates.gmailIds = [...gmailIds, rawId];
          }
          break;
        }
        case "analysis": {
          console.log("Processing analysis case");
          const analysisIds = project.analysisIds || [];
          if (!analysisIds.includes(rawId)) {
            console.log(`Adding analysis item to project: ${rawId}`);
            updates.analysisIds = [...analysisIds, rawId];
          }
          break;
        }
        default: {
          throw new Error(`Unsupported item type: ${args.itemType}`);
        }
      }

      console.log("About to patch project with updates:", updates);
      
      // Only update if there are actual changes
      if (Object.keys(updates).length > 1) { // More than just updatedAt
        await ctx.db.patch(args.projectId, updates);
        console.log("Successfully patched project");
      } else {
        console.log("No changes needed - item already exists in project");
      }
      
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

// Migration function to fix analysis items stored in wrong arrays
export const migrateAnalysisItems = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    console.log("migrateAnalysisItems called for project:", args.projectId);
    
    try {
      const project = await validateProjectOwnership(ctx, args.projectId, args.userId);
      console.log("Project found:", project);

      const updates: any = {
        updatedAt: Date.now(),
      };
      
      let hasChanges = false;
      
      // Check Instagram posts for analysis items
      const instagramPostIds = project.instagramPostIds || [];
      const analysisIds = project.analysisIds || [];
      const newAnalysisIds = [...analysisIds];
      const newInstagramPostIds = [];
      
      for (const id of instagramPostIds) {
        if (id.includes(':')) {
          const parts = id.split(':');
          if (parts.length === 3) {
            const [platform, analysisId, indexStr] = parts;
            const index = parseInt(indexStr, 10);
            
            // If this looks like an analysis item
            if (!isNaN(index) && ['instagram', 'youtube', 'gmail'].includes(platform)) {
              console.log("Found analysis item in Instagram posts:", id);
              if (!newAnalysisIds.includes(id)) {
                newAnalysisIds.push(id);
                hasChanges = true;
              }
            } else {
              newInstagramPostIds.push(id);
            }
          } else {
            newInstagramPostIds.push(id);
          }
        } else {
          newInstagramPostIds.push(id);
        }
      }
      
      // Check YouTube videos for analysis items
      const youtubeVideoIds = project.youtubeVideoIds || [];
      const newYoutubeVideoIds = [];
      
      for (const id of youtubeVideoIds) {
        if (id.includes(':')) {
          const parts = id.split(':');
          if (parts.length === 3) {
            const [platform, analysisId, indexStr] = parts;
            const index = parseInt(indexStr, 10);
            
            // If this looks like an analysis item
            if (!isNaN(index) && ['instagram', 'youtube', 'gmail'].includes(platform)) {
              console.log("Found analysis item in YouTube videos:", id);
              if (!newAnalysisIds.includes(id)) {
                newAnalysisIds.push(id);
                hasChanges = true;
              }
            } else {
              newYoutubeVideoIds.push(id);
            }
          } else {
            newYoutubeVideoIds.push(id);
          }
        } else {
          newYoutubeVideoIds.push(id);
        }
      }
      
      // Check Gmail items for analysis items
      const gmailIds = project.gmailIds || [];
      const newGmailIds = [];
      
      for (const id of gmailIds) {
        if (id.includes(':')) {
          const parts = id.split(':');
          if (parts.length === 3) {
            const [platform, analysisId, indexStr] = parts;
            const index = parseInt(indexStr, 10);
            
            // If this looks like an analysis item
            if (!isNaN(index) && ['instagram', 'youtube', 'gmail'].includes(platform)) {
              console.log("Found analysis item in Gmail items:", id);
              if (!newAnalysisIds.includes(id)) {
                newAnalysisIds.push(id);
                hasChanges = true;
              }
            } else {
              newGmailIds.push(id);
            }
          } else {
            newGmailIds.push(id);
          }
        } else {
          newGmailIds.push(id);
        }
      }
      
      if (hasChanges) {
        updates.instagramPostIds = newInstagramPostIds;
        updates.youtubeVideoIds = newYoutubeVideoIds;
        updates.gmailIds = newGmailIds;
        updates.analysisIds = newAnalysisIds;
        
        await ctx.db.patch(args.projectId, updates);
        console.log("Successfully migrated analysis items");
        return true;
      } else {
        console.log("No analysis items found to migrate");
        return false;
      }
      
    } catch (error) {
      console.error("Failed to migrate analysis items:", error);
      throw new Error("Failed to migrate analysis items. Please try again.");
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
    console.log("removeItemFromProject called with args:", args);
    
    const project = await validateProjectOwnership(ctx, args.projectId, args.userId);
    console.log("Project found:", project);

    // Validate the item ID
    if (!args.itemId || typeof args.itemId !== 'string') {
      throw new Error("Valid item ID is required");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    try {
      console.log("Processing itemType:", args.itemType);
      switch (args.itemType) {
        case "note": {
          console.log("Processing note removal case");
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
          console.log("Processing analysis removal case");
          const analysisIds = project.analysisIds || [];
          console.log("Current analysisIds:", analysisIds);
          console.log("Removing itemId:", args.itemId);
          updates.analysisIds = analysisIds.filter(id => id !== args.itemId);
          console.log("Updated analysisIds:", updates.analysisIds);
          break;
        }
        default: {
          throw new Error(`Unsupported item type: ${args.itemType}`);
        }
      }

      console.log("About to patch project with updates:", updates);
      
      // Only update if there are actual changes
      if (Object.keys(updates).length > 1) { // More than just updatedAt
        await ctx.db.patch(args.projectId, updates);
        console.log("Successfully patched project");
      } else {
        console.log("No changes needed - item already removed from project");
      }
      
      return args.projectId;
    } catch (error) {
      console.error("Failed to remove item from project:", error);
      throw new Error("Failed to remove item from project. Please try again.");
    }
  },
});

// Update project fingerprint ID
export const updateProjectFingerprintId = mutation({
  args: {
    projectId: v.id("projects"),
    fingerprintId: v.union(v.id("project_fingerprints"), v.null()),
    userId: v.optional(v.string()), // For ownership validation
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    // Validate project ownership
    await validateProjectOwnership(ctx, args.projectId, args.userId);

    try {
      await ctx.db.patch(args.projectId, {
        fingerprintId: args.fingerprintId,
        updatedAt: Date.now(),
      });
      return args.projectId;
    } catch (error) {
      console.error("Failed to update project fingerprint ID:", error);
      throw new Error("Failed to update project fingerprint ID. Please try again.");
    }
  },
});
