// @ts-nocheck
import { action, mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";

// Google Gemini API endpoint for embeddings
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";


/**
 * Delete embedding for specific content
 */
export const deleteEmbedding = mutation({
  args: {
    userId: v.string(),
    contentId: v.string(),
  },
  handler: async (ctx, args) => {
    const embedding = await ctx.db
      .query("contentEmbeddings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("contentId"), args.contentId))
      .first();

    if (embedding) {
      await ctx.db.delete(embedding._id);
      return true;
    }
    return false;
  },
});

/**
 * Delete all embeddings for a user
 */
export const deleteAllUserEmbeddings = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('🗑️ [EMBEDDING DELETE] Starting deletion for user:', args.userId);
    
    try {
      // Get all user embeddings
      const embeddings = await ctx.db
        .query("contentEmbeddings")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect();

      console.log('🗑️ [EMBEDDING DELETE] Found', embeddings.length, 'embeddings to delete');

      // Delete all embeddings
      let deleted = 0;
      for (const embedding of embeddings) {
        await ctx.db.delete(embedding._id);
        deleted++;
      }

      console.log('✅ [EMBEDDING DELETE] Successfully deleted', deleted, 'embeddings');
      
      return {
        success: true,
        deletedCount: deleted,
        message: `Successfully deleted ${deleted} embeddings`
      };
    } catch (error: any) {
      console.error('❌ [EMBEDDING DELETE] Error deleting embeddings:', error);
      throw error;
    }
  },
});