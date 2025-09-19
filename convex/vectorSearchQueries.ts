// @ts-nocheck
import { action, mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";
import { cosineSimilarity } from "./vectorSearchHelpers";
import { generateEmbedding } from "./vectorSearchEmbeddings";

// Google Gemini API endpoint for embeddings
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

/**
 * Get all embeddings for a user with optional content type filter (internal)
 */
export const getAllUserEmbeddings = internalQuery({
  args: {
    userId: v.string(),
    contentTypes: v.optional(v.array(v.union(
      v.literal("conversation"),
      v.literal("note"),
      v.literal("crystal"),
    ))),
  },
  handler: async (ctx, args) => {
    let embeddings = await ctx.db
      .query("contentEmbeddings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter by content types if specified
    if (args.contentTypes && args.contentTypes.length > 0) {
      embeddings = embeddings.filter(e => args.contentTypes!.includes(e.contentType));
    }

    return embeddings;
  },
});

/**
 * Get all embeddings for a user (for debugging/admin)
 */
export const getUserEmbeddings = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contentEmbeddings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 20);
  },
});

/**
 * Get embedding count for a specific content type
 */
export const getContentTypeEmbeddingCount = query({
  args: {
    userId: v.string(),
    contentType: v.union(
      v.literal("conversation"),
      v.literal("note"),
      v.literal("crystal"),
    ),
  },
  handler: async (ctx, args) => {
    console.log(`🔍 [CONTENT TYPE COUNT] Checking ${args.contentType} embeddings for user:`, args.userId);
    
    try {
      const embeddings = await ctx.db
        .query("contentEmbeddings")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("contentType"), args.contentType))
        .collect();

      const count = embeddings.length;
      const hasEmbeddings = count > 0;
      
      console.log(`✅ [CONTENT TYPE COUNT] Found ${count} ${args.contentType} embeddings`);
      
      return {
        hasEmbeddings,
        count
      };
    } catch (error: any) {
      console.error(`❌ [CONTENT TYPE COUNT] Error checking ${args.contentType} embeddings:`, error);
      return { hasEmbeddings: false, count: 0 };
    }
  },
});

/**
 * Get embedding by content ID
 */
export const getEmbeddingByContentId = query({
  args: {
    userId: v.string(),
    contentId: v.string()
  },
  handler: async (ctx, args) => {
    try {
      const embedding = await ctx.db
        .query("contentEmbeddings")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("contentId"), args.contentId))
        .first();

      return embedding;
    } catch (error) {
      console.warn('⚠️ [EMBEDDING QUERY] Failed to get embedding by content ID:', error);
      return null;
    }
  }
});



/**
 * Check if user has any embeddings
 */
export const hasUserEmbeddings = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const embedding = await ctx.db
        .query("contentEmbeddings")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .first();

      const count = embedding ? await ctx.db
        .query("contentEmbeddings")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect()
        .then(results => results.length) : 0;

      return {
        hasEmbeddings: !!embedding,
        count: count
      };
    } catch (error) {
      console.warn('⚠️ [EMBEDDING QUERY] Failed to check user embeddings:', {
        userId: args.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Return safe defaults instead of throwing
      return {
        hasEmbeddings: false,
        count: 0
      };
    }
  },
});