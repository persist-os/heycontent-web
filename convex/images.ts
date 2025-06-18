import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Generate upload URL
export const generateImageUploadUrl = mutation({
  handler: async (ctx) => {
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) throw new Error("Authentication required");
    
    return await ctx.storage.generateUploadUrl();
  },
});

// Save image metadata after upload
export const saveImageMetadata = mutation({
  args: {
    noteId: v.optional(v.id("notes")),
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) throw new Error("Authentication required");
    
    // const user = await ctx.db
    //   .query("users")
    //   .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    //   .unique();
    
    // if (!user) throw new Error("User not found");

    // Temporary: Use default user ID for testing
    const defaultUserId = "test-user-id";

    const now = Date.now();
    
    return await ctx.db.insert("noteImages", {
      noteId: args.noteId,
      userId: defaultUserId,
      storageId: args.storageId,
      filename: args.filename,
      contentType: args.contentType,
      size: args.size,
      uploadedAt: now,
      caption: "",
      order: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get images for a note
export const getImagesByNote = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) throw new Error("Authentication required");

    const images = await ctx.db
      .query("noteImages")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .collect();
    
    // Generate URLs for images
    return await Promise.all(
      images.map(async (image) => ({
        ...image,
        url: await ctx.storage.getUrl(image.storageId),
      }))
    );
  },
});

// Get all images for a user
export const getImagesByUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required");

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    
    if (!user) throw new Error("User not found");

    const images = await ctx.db
      .query("noteImages")
      .withIndex("by_user", (q) => q.eq("userId", user.userId))
      .collect();
    
    // Generate URLs for images
    return await Promise.all(
      images.map(async (image) => ({
        ...image,
        url: await ctx.storage.getUrl(image.storageId),
      }))
    );
  },
});

// Delete an image
export const deleteImage = mutation({
  args: { imageId: v.id("noteImages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required");

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    
    if (!user) throw new Error("User not found");

    const image = await ctx.db.get(args.imageId);
    if (!image) throw new Error("Image not found");
    
    // Check if user owns the image
    if (image.userId !== user.userId) {
      throw new Error("Unauthorized");
    }

    // Delete from storage
    await ctx.storage.delete(image.storageId);
    
    // Delete from database
    await ctx.db.delete(args.imageId);
    
    return { success: true };
  },
});

// Update image caption
export const updateImageCaption = mutation({
  args: { 
    imageId: v.id("noteImages"),
    caption: v.string()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required");

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    
    if (!user) throw new Error("User not found");

    const image = await ctx.db.get(args.imageId);
    if (!image) throw new Error("Image not found");
    
    // Check if user owns the image
    if (image.userId !== user.userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.imageId, {
      caption: args.caption,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
}); 