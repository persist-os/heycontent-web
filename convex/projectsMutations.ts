import { v, Infer } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { generateProjectPosition, calculateProjectSpaceRadius } from "./positioningUtils";
import { generateNextGridPosition } from "./gridPositioningUtils";

// Shared validators
const CreateProjectArgsValidator = v.object({
  userId: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
});

const UpdateProjectArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.optional(v.string()),
  name: v.optional(v.string()),
  description: v.optional(v.string()),
});

const UpdateProjectGridPositionArgsValidator = v.object({
  projectId: v.id("projects"),
  grid_x: v.number(),
  grid_y: v.number(),
});

const DeleteProjectArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.optional(v.string()),
});

const AddItemToProjectArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.optional(v.string()),
  itemType: v.union(
    v.literal("note"),
    v.literal("conversation"),
    v.literal("instagramPost"),
    v.literal("youtubeVideo"),
    v.literal("gmail"),
    v.literal("analysis")
  ),
  itemId: v.string(),
});

const RemoveItemFromProjectArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.optional(v.string()),
  itemType: v.union(
    v.literal("note"),
    v.literal("conversation"),
    v.literal("instagramPost"),
    v.literal("youtubeVideo"),
    v.literal("gmail"),
    v.literal("analysis")
  ),
  itemId: v.string(),
});

const MigrateAnalysisItemsArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.optional(v.string()),
});

const UpdateProjectFingerprintIdArgsValidator = v.object({
  projectId: v.id("projects"),
  fingerprintId: v.union(v.id("project_fingerprints"), v.null()),
  userId: v.optional(v.string()),
});

// Infer TypeScript types
export type CreateProjectArgs = Infer<typeof CreateProjectArgsValidator>;
export type UpdateProjectArgs = Infer<typeof UpdateProjectArgsValidator>;
export type UpdateProjectGridPositionArgs = Infer<typeof UpdateProjectGridPositionArgsValidator>;
export type DeleteProjectArgs = Infer<typeof DeleteProjectArgsValidator>;
export type AddItemToProjectArgs = Infer<typeof AddItemToProjectArgsValidator>;
export type RemoveItemFromProjectArgs = Infer<typeof RemoveItemFromProjectArgsValidator>;
export type MigrateAnalysisItemsArgs = Infer<typeof MigrateAnalysisItemsArgsValidator>;
export type UpdateProjectFingerprintIdArgs = Infer<typeof UpdateProjectFingerprintIdArgsValidator>;

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

// Create a new project with static positioning
export const createProject = mutation({
  args: CreateProjectArgsValidator,
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
      // Get existing projects for collision detection
      const existingProjects = await ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      // Generate non-overlapping position using new grid system
      const gridPosition = generateNextGridPosition(existingProjects);
      
      // Calculate pixel position from grid coordinates
      const GRID_CELL_WIDTH = 1200;
      const GRID_CELL_HEIGHT = 800;
      const GRID_SPACING = 50;
      const CANVAS_WIDTH = 2400;
      const CANVAS_HEIGHT = 1600;
      const GRID_ORIGIN_X = CANVAS_WIDTH / 2;
      const GRID_ORIGIN_Y = CANVAS_HEIGHT / 2;
      
      const position_x = GRID_ORIGIN_X + gridPosition.grid_x * (GRID_CELL_WIDTH + GRID_SPACING);
      const position_y = GRID_ORIGIN_Y + gridPosition.grid_y * (GRID_CELL_HEIGHT + GRID_SPACING);
      
      // Calculate initial space radius (will be updated when widgets are added)
      const spaceRadius = calculateProjectSpaceRadius(0);

      const projectId = await ctx.db.insert("projects", {
        userId: args.userId,
        name: sanitizedName,
        description: sanitizedDescription,
        noteIds: [],
        conversationIds: [],
        analysisIds: [],
        createdAt: now,
        updatedAt: now,
        // Legacy positioning fields (for backward compatibility)
        position_x: position_x,
        position_y: position_y,
        space_radius: spaceRadius,
        // New grid positioning fields
        grid_x: gridPosition.grid_x,
        grid_y: gridPosition.grid_y,
        grid_width: GRID_CELL_WIDTH,
        grid_height: GRID_CELL_HEIGHT,
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
  args: UpdateProjectArgsValidator,
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

// Update project grid position (snaps to grid and updates legacy pixel fields)
export const updateProjectGridPosition = mutation({
  args: UpdateProjectGridPositionArgsValidator,
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Grid constants mirrored from creation logic
    const GRID_CELL_WIDTH = 1200;
    const GRID_CELL_HEIGHT = 800;
    const GRID_SPACING = 50;
    const CANVAS_WIDTH = 2400;
    const CANVAS_HEIGHT = 1600;
    const GRID_ORIGIN_X = CANVAS_WIDTH / 2;
    const GRID_ORIGIN_Y = CANVAS_HEIGHT / 2;

    const position_x = GRID_ORIGIN_X + args.grid_x * (GRID_CELL_WIDTH + GRID_SPACING);
    const position_y = GRID_ORIGIN_Y + args.grid_y * (GRID_CELL_HEIGHT + GRID_SPACING);

    await ctx.db.patch(args.projectId, {
      grid_x: args.grid_x,
      grid_y: args.grid_y,
      grid_width: GRID_CELL_WIDTH,
      grid_height: GRID_CELL_HEIGHT,
      position_x,
      position_y,
      updatedAt: Date.now(),
    });
    return null;
  },
});

// Delete a project and all associated data
export const deleteProject = mutation({
  args: DeleteProjectArgsValidator,
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await validateProjectOwnership(ctx, args.projectId, args.userId);

    try {
      // Get the project to find associated fingerprint
      const project = await ctx.db.get(args.projectId);
      if (!project) {
        throw new Error("Project not found");
      }

      // Delete associated fingerprints (both by fingerprintId field and by projectId query)
      const fingerprintsToDelete = new Set<string>();
      
      // Add fingerprint from project.fingerprintId if it exists
      if (project.fingerprintId) {
        fingerprintsToDelete.add(project.fingerprintId);
      }
      
      // Also search for fingerprints by projectId (in case fingerprintId field is missing/corrupted)
      try {
        const fingerprintsByProject = await ctx.db
          .query("project_fingerprints")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .collect();
        
        for (const fingerprint of fingerprintsByProject) {
          fingerprintsToDelete.add(fingerprint._id);
        }
        console.log(`Found ${fingerprintsByProject.length} fingerprints by projectId query`);
      } catch (error) {
        console.warn("Failed to query fingerprints by projectId:", error);
      }
      
      // Delete all found fingerprints
      for (const fingerprintId of Array.from(fingerprintsToDelete)) {
        try {
          await ctx.db.delete(fingerprintId as any);
          console.log("Deleted fingerprint:", fingerprintId);
        } catch (error) {
          console.warn("Failed to delete fingerprint:", fingerprintId, error);
        }
      }

      // Delete all associated widgets by projectId
      try {
        const widgets = await ctx.db
          .query("project_widgets")
          .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
          .collect();

        for (const widget of widgets) {
          await ctx.db.delete(widget._id);
        }
        console.log(`Deleted ${widgets.length} associated widgets`);
      } catch (error) {
        console.warn("Failed to delete widgets:", error);
        // Continue with project deletion even if widget deletion fails
      }

      // Finally, delete the project itself
      await ctx.db.delete(args.projectId);
      console.log("Successfully deleted project:", args.projectId);
      return true;
    } catch (error) {
      console.error("Failed to delete project:", error);
      throw new Error("Failed to delete project. Please try again.");
    }
  },
});

// Add an item to a project
export const addItemToProject = mutation({
  args: AddItemToProjectArgsValidator,
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
      
      // Instagram, YouTube, and Gmail items are not supported in the current schema
      
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
        case "instagramPost":
        case "youtubeVideo":
        case "gmail": {
          throw new Error(`Item type ${args.itemType} is not supported in the current schema`);
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
  args: MigrateAnalysisItemsArgsValidator,
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
      
      // Instagram, YouTube, and Gmail items are not supported in the current schema
      console.log("No analysis items found to migrate - schema does not support Instagram/YouTube/Gmail items");
      return false;
      
    } catch (error) {
      console.error("Failed to migrate analysis items:", error);
      throw new Error("Failed to migrate analysis items. Please try again.");
    }
  },
});

// Remove an item from a project
export const removeItemFromProject = mutation({
  args: RemoveItemFromProjectArgsValidator,
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
        case "instagramPost":
        case "youtubeVideo":
        case "gmail": {
          throw new Error(`Item type ${args.itemType} is not supported in the current schema`);
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
  args: UpdateProjectFingerprintIdArgsValidator,
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
