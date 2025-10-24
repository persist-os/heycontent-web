import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Create a new folder
export const createFolder = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    parentFolderId: v.optional(v.id("folders")),
    color: v.optional(v.string()),
  },
  returns: v.id("folders"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if parent folder exists and belongs to user
    if (args.parentFolderId) {
      const parentFolder = await ctx.db.get(args.parentFolderId);
      if (!parentFolder || parentFolder.userId !== args.userId) {
        throw new Error("Parent folder not found or access denied");
      }
    }
    
    const folderId = await ctx.db.insert("folders", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      parentFolderId: args.parentFolderId,
      color: args.color,
      createdAt: now,
      updatedAt: now,
    });
    
    return folderId;
  },
});

// Update an existing folder
export const updateFolder = mutation({
  args: {
    folderId: v.id("folders"),
    userId: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      parentFolderId: v.optional(v.id("folders")),
      color: v.optional(v.string()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.userId !== args.userId) {
      throw new Error("Folder not found or access denied");
    }
    
    // Check if new parent folder exists and belongs to user
    if (args.updates.parentFolderId) {
      const parentFolder = await ctx.db.get(args.updates.parentFolderId);
      if (!parentFolder || parentFolder.userId !== args.userId) {
        throw new Error("Parent folder not found or access denied");
      }
      
      // Prevent circular references
      if (args.updates.parentFolderId === args.folderId) {
        throw new Error("Cannot set folder as its own parent");
      }
    }
    
    await ctx.db.patch(args.folderId, {
      ...args.updates,
      updatedAt: Date.now(),
    });
    
    return null;
  },
});

// Delete a folder (and optionally move contents)
export const deleteFolder = mutation({
  args: {
    folderId: v.id("folders"),
    userId: v.string(),
    moveContentsToParent: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.userId !== args.userId) {
      throw new Error("Folder not found or access denied");
    }
    
    // Handle contents based on moveContentsToParent flag
    if (args.moveContentsToParent) {
      // Move all notes to parent folder (or root if no parent)
      const notesInFolder = await ctx.db
        .query("notes")
        .withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
        .collect();
      
      for (const note of notesInFolder) {
        await ctx.db.patch(note._id, {
          folderId: folder.parentFolderId,
          updatedAt: Date.now(),
        });
      }
      
      // Move all subfolders to parent folder (or root if no parent)
      const subfolders = await ctx.db
        .query("folders")
        .withIndex("by_parent", (q) => q.eq("parentFolderId", args.folderId))
        .collect();
      
      for (const subfolder of subfolders) {
        await ctx.db.patch(subfolder._id, {
          parentFolderId: folder.parentFolderId,
          updatedAt: Date.now(),
        });
      }
    } else {
      // Delete all contents recursively
      const notesInFolder = await ctx.db
        .query("notes")
        .withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
        .collect();
      
      for (const note of notesInFolder) {
        await ctx.db.delete(note._id);
      }
      
      // Recursively delete subfolders
      const subfolders = await ctx.db
        .query("folders")
        .withIndex("by_parent", (q) => q.eq("parentFolderId", args.folderId))
        .collect();
      
      for (const subfolder of subfolders) {
        // Recursive call to delete subfolder
          await ctx.runMutation(internal.folderMutations.deleteFolder, {
          folderId: subfolder._id,
          userId: args.userId,
          moveContentsToParent: false,
        });
      }
    }
    
    // Delete the folder itself
    await ctx.db.delete(args.folderId);
    
    return null;
  },
});

// Move a note to a folder
export const moveNoteToFolder = mutation({
  args: {
    noteId: v.id("notes"),
    folderId: v.optional(v.id("folders")),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== args.userId) {
      throw new Error("Note not found or access denied");
    }
    
    // Check if folder exists and belongs to user
    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId);
      if (!folder || folder.userId !== args.userId) {
        throw new Error("Folder not found or access denied");
      }
    }
    
    await ctx.db.patch(args.noteId, {
      folderId: args.folderId,
      updatedAt: Date.now(),
    });
    
    return null;
  },
});
