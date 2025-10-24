import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Shard Queries
 * 
 * All shard-specific query operations.
 * Separate from crystal queries for clean architecture.
 */

// Shared handler for retrieving shards by IDs with user validation
async function getShardsByIdsHandler(
  ctx: any,
  userId: string,
  shardIds: string[]
) {
  const shards = [];
  
  for (const shardId of shardIds) {
    try {
      const shard = await ctx.db.get(shardId as Id<"crystal_shards">);
      
      // Only include shards that exist and belong to the user
      if (shard && shard.userId === userId) {
        shards.push(shard);
      }
    } catch (error) {
      // Skip invalid IDs, continue with others
      continue;
    }
  }
  
  // Sort by creation time, most recent first
  shards.sort((a, b) => b._creationTime - a._creationTime);
  
  return shards;
}

export const getShardsByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, { userId, limit }) => {
    const shards = await ctx.db
      .query("crystal_shards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit)
    
    return shards;
  },
});

/**
 * Retrieve crystal shards by their IDs
 * 
 * Fetches multiple shards in a single query with user ownership validation.
 * Silently skips shards that don't exist or belong to other users.
 * 
 * @param userId - User ID for ownership validation
 * @param shardIds - Array of shard IDs to retrieve
 * @returns Array of shard objects that exist and belong to the user
 */
export const getShardsByIds = query({
  args: {
    userId: v.string(),
    shardIds: v.array(v.string())
  },
  returns: v.array(v.any()),
  handler: async (ctx, { userId, shardIds }) => {
    return await getShardsByIdsHandler(ctx, userId, shardIds);
  }
});

/**
 * Internal query for shard retrieval by IDs
 * 
 * Used internally by other Convex functions (e.g., vector search).
 * Same functionality as getShardsByIds but accessible only to internal calls.
 */
export const getShardsByIdsInternal = internalQuery({
  args: {
    userId: v.string(),
    shardIds: v.array(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, { userId, shardIds }) => {
    return await getShardsByIdsHandler(ctx, userId, shardIds);
  }
});

/**
 * Get shards by widget ID
 */
export const getShardsByWidgetId = query({
  args: {
    widgetId: v.union(v.string(), v.id("widgets")),
    userId: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, { widgetId, userId }) => {
    const shards = await ctx.db
      .query("crystal_shards")
      .withIndex("by_widget", (q) => q.eq("widgetId", widgetId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    
    return shards;
  },
});

/**
 * Get shards by status
 * 
 * Efficiently queries shards by their lifecycle status.
 * Useful for crystal formation (unprocessed) and cleanup (archived).
 */
export const getShardsByStatus = query({
  args: {
    userId: v.string(),
    status: v.union(
      v.literal("unprocessed"),
      v.literal("reserved"),
      v.literal("used_for_crystal"),
      v.literal("archived")
    ),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, { userId, status, limit }) => {
    const query = ctx.db
      .query("crystal_shards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("shard_status"), status))
      .order("desc");
    
    if (limit) {
      return await query.take(limit);
    }
    
    return await query.collect();
  },
});

/**
 * Get unprocessed shards count
 * 
 * Quick count of shards available for crystal formation.
 */
export const getUnprocessedShardsCount = query({
  args: {
    userId: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, { userId }) => {
    const shards = await ctx.db
      .query("crystal_shards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("shard_status"), "unprocessed"))
      .collect();
    
    return shards.length;
  },
});

