import { query, action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";

/**
 * Single cognitive field query function
 * 
 * Flexible query that can get cognitive fields by various criteria.
 * Follows the same pattern as crystalQueries.ts for consistency.
 * 
 * COGNITIVE FIELDS ONLY - For shard queries, use queryShard in shardQueries.ts
 */
export const queryCognitiveField = query({
  args: {
    userId: v.string(),
    useIndex: v.optional(v.string()),
    indexFields: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))),
    filters: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))),
    limit: v.optional(v.number()),
    orderBy: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, { userId, useIndex, indexFields, filters, limit, orderBy }) => {
    try {
      let query;
      
      // Index field mappings: which indexes include userId
      // CRITICAL: Only filter by userId in index query builder if index includes it
      const indexesWithUserId = ["by_user", "by_conversation_user", "by_status", "by_created", "by_updated", "by_usage", "by_optimization", "by_archived"];
      const indexIncludesUserId = useIndex ? indexesWithUserId.includes(useIndex) : false;
      
      // Start with base query using specified index or default to by_user
      if (useIndex && indexFields) {
        query = ctx.db.query("cognitive_fields").withIndex(useIndex as any, (q: any) => {
          let queryBuilder = q;
          
          // Only filter by userId in index query builder if index includes it
          if (indexIncludesUserId) {
            queryBuilder = queryBuilder.eq("userId", userId);
          }
          
          // Filter by index fields (these must be part of the index)
          Object.entries(indexFields).forEach(([field, value]) => {
            queryBuilder = queryBuilder.eq(field, value);
          });
          
          return queryBuilder;
        });
        
        // If index doesn't include userId, filter by it after the index query
        if (!indexIncludesUserId) {
          query = query.filter((q: any) => q.eq(q.field("userId"), userId));
        }
      } else {
        query = ctx.db.query("cognitive_fields").withIndex("by_user", (q) => q.eq("userId", userId));
      }

      // Apply additional filters
      if (filters) {
        Object.entries(filters).forEach(([field, value]) => {
          query = query.filter((q: any) => q.eq(q.field(field), value));
        });
      }

      // Apply ordering if specified
      if (orderBy) {
        query = query.order(orderBy);
      }

      // Apply limit if specified - use .take() OR .collect(), not both
      // .take() returns Promise directly, can't chain .collect() after it
      const results = limit 
        ? await query.take(limit) 
        : await query.collect();
      
      return results;
    } catch (error) {
      console.error("Error querying cognitive fields:", error);
      throw error;
    }
  },
});

/**
 * Get all cognitive fields for a user (with pagination)
 */
export const getAllCognitiveFields = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number())
  },
  handler: async (ctx, { userId, limit = 50, offset = 0 }) => {
    try {
      const query = ctx.db.query("cognitive_fields")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc");
      
      if (offset > 0) {
        const results = await query.collect();
        const paginatedResults = results.slice(offset);
        return limit ? paginatedResults.slice(0, limit) : paginatedResults;
      }
      
      return limit ? await query.take(limit) : await query.collect();
    } catch (error) {
      console.error("Error getting all cognitive fields:", error);
      throw error;
    }
  },
});

/**
 * Get cognitive field by conversation (1:1 relationship)
 */
export const getCognitiveFieldByConversation = query({
  args: { 
    conversationId: v.string(),
    userId: v.string()
  },
  handler: async (ctx, { conversationId, userId }) => {
    try {
      // Use compound index for efficient per-conversation query with ownership validation
      const field = await ctx.db.query("cognitive_fields")
        .withIndex("by_conversation_user", (q) => 
          q.eq("conversationId", conversationId).eq("userId", userId)
        )
        .first();
      
      return field || null;
    } catch (error) {
      console.error("Error getting cognitive field by conversation:", error);
      throw error;
    }
  },
});

/**
 * Count cognitive fields for a user
 */
export const countCognitiveFields = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    try {
      const fields = await ctx.db.query("cognitive_fields")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      
      return fields.length;
    } catch (error) {
      console.error("Error counting cognitive fields:", error);
      throw error;
    }
  },
});

/**
 * Get cognitive fields that need optimization (low usage, old, etc.)
 */
export const getCognitiveFieldsNeedingOptimization = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, { userId, limit }) => {
    try {
      const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      const query = ctx.db.query("cognitive_fields")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => {
          return q.or(
            q.eq(q.field("usageCount"), 0), // Never used
            q.lt(q.field("lastUsed"), cutoffTime), // Not used in 30 days
            q.eq(q.field("status"), "evolving") // Still evolving
          );
        });
      
      return limit ? await query.take(limit) : await query.collect();
    } catch (error) {
      console.error("Error getting cognitive fields needing optimization:", error);
      throw error;
    }
  },
});
