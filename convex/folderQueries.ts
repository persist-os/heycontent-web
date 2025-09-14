import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get all folders for a user
export const getUserFolders = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("folders"),
    _creationTime: v.number(),
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    parentFolderId: v.optional(v.id("folders")),
    color: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const folders = await ctx.db
      .query("folders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    return folders;
  },
});

// Get folders by parent (for building hierarchy)
export const getFoldersByParent = query({
  args: {
    userId: v.string(),
    parentFolderId: v.optional(v.id("folders")),
  },
  returns: v.array(v.object({
    _id: v.id("folders"),
    _creationTime: v.number(),
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    parentFolderId: v.optional(v.id("folders")),
    color: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const folders = await ctx.db
      .query("folders")
      .withIndex("by_user_parent", (q) => 
        q.eq("userId", args.userId).eq("parentFolderId", args.parentFolderId)
      )
      .order("desc")
      .collect();
    
    return folders;
  },
});

// Get a specific folder
export const getFolder = query({
  args: {
    folderId: v.id("folders"),
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("folders"),
      _creationTime: v.number(),
      userId: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      parentFolderId: v.optional(v.id("folders")),
      color: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.userId !== args.userId) {
      return null;
    }
    return folder;
  },
});

// Get notes in a specific folder
export const getNotesInFolder = query({
  args: {
    userId: v.string(),
    folderId: v.optional(v.id("folders")),
  },
  returns: v.array(v.object({
    _id: v.id("notes"),
    _creationTime: v.number(),
    userId: v.string(),
    title: v.string(),
    content: v.optional(v.string()),
    important: v.optional(v.boolean()),
    platform: v.optional(v.string()),
    references: v.optional(v.array(v.string())),
    type: v.optional(v.union(
      v.literal("idea_bank"),
      v.literal("content_script"),
      v.literal("collaboration_note"),
      v.literal("analytics_insight"),
      v.literal("reflection_journal"),
      v.literal("task_checklist"),
      v.literal("email_draft"),
      v.literal("idea")
    )),
    tags: v.array(v.string()),
    analysis: v.optional(v.string()),
    images: v.optional(v.array(v.object({
      url: v.string(),
      filename: v.string(),
      originalFilename: v.optional(v.string()),
      uploadedAt: v.number(),
      size: v.optional(v.number()),
      mimeType: v.optional(v.string()),
      width: v.optional(v.number()),
      height: v.optional(v.number())
    }))),
    sourceConversationId: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
    createdAt: v.number(),
    updatedAt: v.number(),
    titleGenerated: v.optional(v.boolean()),
    typeGenerated: v.optional(v.boolean()),
  })),
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();
    
    return notes;
  },
});

// Get folder hierarchy (breadcrumb path)
export const getFolderPath = query({
  args: {
    folderId: v.id("folders"),
    userId: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("folders"),
    name: v.string(),
    parentFolderId: v.optional(v.id("folders")),
  })),
  handler: async (ctx, args) => {
    const path = [];
    let currentFolderId: Id<"folders"> | undefined = args.folderId;
    
    while (currentFolderId) {
      const folder = await ctx.db.get(currentFolderId);
      if (!folder || folder.userId !== args.userId) {
        break;
      }
      
      path.unshift({
        _id: folder._id,
        name: folder.name,
        parentFolderId: folder.parentFolderId,
      });
      
      currentFolderId = folder.parentFolderId;
    }
    
    return path;
  },
});

// Get folder statistics (count of notes and subfolders)
export const getFolderStats = query({
  args: {
    folderId: v.optional(v.id("folders")),
    userId: v.string(),
  },
  returns: v.object({
    noteCount: v.number(),
    subfolderCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    const subfolders = await ctx.db
      .query("folders")
      .withIndex("by_parent", (q) => q.eq("parentFolderId", args.folderId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    return {
      noteCount: notes.length,
      subfolderCount: subfolders.length,
    };
  },
});
