// @ts-nocheck
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Crystal Data Caching System
 * Implements intelligent caching for frequently accessed crystal data
 * Reduces database load and improves query performance
 */

/**
 * Cache entry structure for crystal data
 */
const cacheEntryValidator = v.object({
  userId: v.string(),
  cacheKey: v.string(),
  cacheType: v.union(
    v.literal("crystal_context"),
    v.literal("vector_search"),
    v.literal("formation_context"),
    v.literal("similarity_results")
  ),
  data: v.any(),
  createdAt: v.number(),
  expiresAt: v.number(),
  accessCount: v.number(),
  lastAccessed: v.number(),
  dataSize: v.number(),
  metadata: v.optional(v.object({
    queryParams: v.optional(v.string()),
    resultCount: v.optional(v.number()),
    processingTime: v.optional(v.number()),
  })),
});

/**
 * Get cached data with automatic expiration handling
 */
export const getCachedData = query({
  args: {
    userId: v.string(),
    cacheKey: v.string(),
    cacheType: v.union(
      v.literal("crystal_context"),
      v.literal("vector_search"),
      v.literal("formation_context"),
      v.literal("similarity_results")
    ),
  },
  returns: v.union(
    v.object({
      hit: v.literal(true),
      data: v.any(),
      age: v.number(),
      accessCount: v.number(),
    }),
    v.object({
      hit: v.literal(false),
      reason: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    console.log(`🗄️ [CACHE] Looking up cache key: ${args.cacheKey} for user ${args.userId}`);
    
    try {
      const cacheEntry = await ctx.db
        .query("crystalCache")
        .withIndex("by_user_key", (q) => 
          q.eq("userId", args.userId).eq("cacheKey", args.cacheKey)
        )
        .filter((q) => q.eq(q.field("cacheType"), args.cacheType))
        .first();

      if (!cacheEntry) {
        console.log(`❌ [CACHE] Cache miss: Entry not found`);
        return { hit: false, reason: "Entry not found" };
      }

      // Check if cache entry has expired
      const now = Date.now();
      if (now > cacheEntry.expiresAt) {
        console.log(`⏰ [CACHE] Cache miss: Entry expired (${Math.round((now - cacheEntry.expiresAt) / 1000)}s ago)`);
        
        // Clean up expired entry asynchronously
        ctx.scheduler.runAfter(0, internal.crystalCache.cleanupExpiredEntry, {
          entryId: cacheEntry._id,
        });
        
        return { hit: false, reason: "Entry expired" };
      }

      // Update access statistics asynchronously
      ctx.scheduler.runAfter(0, internal.crystalCache.updateAccessStats, {
        entryId: cacheEntry._id,
      });

      const age = now - cacheEntry.createdAt;
      console.log(`✅ [CACHE] Cache hit: ${args.cacheKey} (age: ${Math.round(age / 1000)}s, access count: ${cacheEntry.accessCount})`);
      
      return {
        hit: true,
        data: cacheEntry.data,
        age,
        accessCount: cacheEntry.accessCount,
      };
      
    } catch (error) {
      console.error(`❌ [CACHE] Error retrieving cache entry:`, error);
      return { hit: false, reason: "Cache error" };
    }
  },
});

/**
 * Store data in cache with intelligent TTL and size management
 */
export const setCachedData = mutation({
  args: {
    userId: v.string(),
    cacheKey: v.string(),
    cacheType: v.union(
      v.literal("crystal_context"),
      v.literal("vector_search"),
      v.literal("formation_context"),
      v.literal("similarity_results")
    ),
    data: v.any(),
    ttlMinutes: v.optional(v.number()),
    metadata: v.optional(v.object({
      queryParams: v.optional(v.string()),
      resultCount: v.optional(v.number()),
      processingTime: v.optional(v.number()),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    cacheKey: v.string(),
    expiresAt: v.number(),
    dataSize: v.number(),
  }),
  handler: async (ctx, args) => {
    console.log(`💾 [CACHE] Storing cache entry: ${args.cacheKey} for user ${args.userId}`);
    
    try {
      const now = Date.now();
      
      // Calculate TTL based on cache type and data characteristics
      let ttlMinutes = args.ttlMinutes;
      if (!ttlMinutes) {
        switch (args.cacheType) {
          case "crystal_context":
            ttlMinutes = 30; // Crystal context changes less frequently
            break;
          case "vector_search":
            ttlMinutes = 15; // Vector search results can be cached briefly
            break;
          case "formation_context":
            ttlMinutes = 60; // Formation context is expensive to compute
            break;
          case "similarity_results":
            ttlMinutes = 20; // Similarity results are moderately stable
            break;
          default:
            ttlMinutes = 15;
        }
      }
      
      const expiresAt = now + (ttlMinutes * 60 * 1000);
      
      // Estimate data size (rough approximation)
      const dataSize = JSON.stringify(args.data).length;
      
      // Check if entry already exists and update it
      const existingEntry = await ctx.db
        .query("crystalCache")
        .withIndex("by_user_key", (q) => 
          q.eq("userId", args.userId).eq("cacheKey", args.cacheKey)
        )
        .filter((q) => q.eq(q.field("cacheType"), args.cacheType))
        .first();

      if (existingEntry) {
        // Update existing entry
        await ctx.db.patch(existingEntry._id, {
          data: args.data,
          createdAt: now,
          expiresAt,
          dataSize,
          metadata: args.metadata,
        });
        
        console.log(`🔄 [CACHE] Updated existing cache entry: ${args.cacheKey} (size: ${dataSize} bytes, TTL: ${ttlMinutes}m)`);
      } else {
        // Create new entry
        await ctx.db.insert("crystalCache", {
          userId: args.userId,
          cacheKey: args.cacheKey,
          cacheType: args.cacheType,
          data: args.data,
          createdAt: now,
          expiresAt,
          accessCount: 0,
          lastAccessed: now,
          dataSize,
          metadata: args.metadata,
        });
        
        console.log(`✨ [CACHE] Created new cache entry: ${args.cacheKey} (size: ${dataSize} bytes, TTL: ${ttlMinutes}m)`);
      }

      // Trigger cache cleanup if needed (asynchronous)
      ctx.scheduler.runAfter(0, internal.crystalCache.cleanupOldEntries, {
        userId: args.userId,
      });

      return {
        success: true,
        cacheKey: args.cacheKey,
        expiresAt,
        dataSize,
      };
      
    } catch (error) {
      console.error(`❌ [CACHE] Error storing cache entry:`, error);
      return {
        success: false,
        cacheKey: args.cacheKey,
        expiresAt: 0,
        dataSize: 0,
      };
    }
  },
});

/**
 * Invalidate cache entries by pattern or type
 */
export const invalidateCache = mutation({
  args: {
    userId: v.string(),
    cacheType: v.optional(v.union(
      v.literal("crystal_context"),
      v.literal("vector_search"),
      v.literal("formation_context"),
      v.literal("similarity_results")
    )),
    keyPattern: v.optional(v.string()),
    invalidateAll: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    invalidatedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    console.log(`🗑️ [CACHE] Invalidating cache entries for user ${args.userId}`);
    
    try {
      let query = ctx.db
        .query("crystalCache")
        .withIndex("by_user", (q) => q.eq("userId", args.userId));

      // Apply cache type filter if specified
      if (args.cacheType) {
        query = query.filter((q) => q.eq(q.field("cacheType"), args.cacheType));
      }

      const entries = await query.collect();
      let entriesToDelete = entries;

      // Apply key pattern filter if specified
      if (args.keyPattern && !args.invalidateAll) {
        entriesToDelete = entries.filter(entry => 
          entry.cacheKey.includes(args.keyPattern!)
        );
      }

      // Delete matching entries
      for (const entry of entriesToDelete) {
        await ctx.db.delete(entry._id);
      }

      console.log(`✅ [CACHE] Invalidated ${entriesToDelete.length} cache entries`);
      
      return {
        success: true,
        invalidatedCount: entriesToDelete.length,
      };
      
    } catch (error) {
      console.error(`❌ [CACHE] Error invalidating cache entries:`, error);
      return {
        success: false,
        invalidatedCount: 0,
      };
    }
  },
});

/**
 * Get cache statistics for monitoring and optimization
 */
export const getCacheStats = query({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    totalEntries: v.number(),
    totalSize: v.number(),
    entriesByType: v.record(v.string(), v.number()),
    sizeByType: v.record(v.string(), v.number()),
    hitRate: v.number(),
    avgAge: v.number(),
    expiredEntries: v.number(),
  }),
  handler: async (ctx, args) => {
    console.log(`📊 [CACHE] Generating cache statistics for user ${args.userId}`);
    
    try {
      const entries = await ctx.db
        .query("crystalCache")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      const now = Date.now();
      const stats = {
        totalEntries: entries.length,
        totalSize: 0,
        entriesByType: {} as Record<string, number>,
        sizeByType: {} as Record<string, number>,
        hitRate: 0,
        avgAge: 0,
        expiredEntries: 0,
      };

      let totalAccessCount = 0;
      let totalAge = 0;

      entries.forEach(entry => {
        // Size statistics
        stats.totalSize += entry.dataSize;
        stats.sizeByType[entry.cacheType] = (stats.sizeByType[entry.cacheType] || 0) + entry.dataSize;
        
        // Type statistics
        stats.entriesByType[entry.cacheType] = (stats.entriesByType[entry.cacheType] || 0) + 1;
        
        // Access statistics
        totalAccessCount += entry.accessCount;
        
        // Age statistics
        totalAge += (now - entry.createdAt);
        
        // Expiration statistics
        if (now > entry.expiresAt) {
          stats.expiredEntries++;
        }
      });

      // Calculate averages
      if (entries.length > 0) {
        stats.hitRate = totalAccessCount / entries.length;
        stats.avgAge = totalAge / entries.length;
      }

      console.log(`📈 [CACHE] Stats: ${stats.totalEntries} entries, ${Math.round(stats.totalSize / 1024)}KB total, ${stats.expiredEntries} expired`);
      
      return stats;
      
    } catch (error) {
      console.error(`❌ [CACHE] Error generating cache statistics:`, error);
      return {
        totalEntries: 0,
        totalSize: 0,
        entriesByType: {},
        sizeByType: {},
        hitRate: 0,
        avgAge: 0,
        expiredEntries: 0,
      };
    }
  },
});

/**
 * Internal function to update access statistics
 */
export const updateAccessStats = internalMutation({
  args: {
    entryId: v.id("crystalCache"),
  },
  handler: async (ctx, args) => {
    try {
      const entry = await ctx.db.get(args.entryId);
      if (entry) {
        await ctx.db.patch(args.entryId, {
          accessCount: entry.accessCount + 1,
          lastAccessed: Date.now(),
        });
      }
    } catch (error) {
      console.error(`❌ [CACHE] Error updating access stats:`, error);
    }
  },
});

/**
 * Internal function to cleanup expired entries
 */
export const cleanupExpiredEntry = internalMutation({
  args: {
    entryId: v.id("crystalCache"),
  },
  handler: async (ctx, args) => {
    try {
      await ctx.db.delete(args.entryId);
      console.log(`🗑️ [CACHE] Cleaned up expired entry: ${args.entryId}`);
    } catch (error) {
      console.error(`❌ [CACHE] Error cleaning up expired entry:`, error);
    }
  },
});

/**
 * Internal function to cleanup old entries when cache gets too large
 */
export const cleanupOldEntries = internalMutation({
  args: {
    userId: v.string(),
    maxEntries: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const maxEntries = args.maxEntries || 100; // Default limit per user
      
      const entries = await ctx.db
        .query("crystalCache")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();

      if (entries.length > maxEntries) {
        // Sort by last accessed (oldest first) and remove excess entries
        const sortedEntries = entries.sort((a, b) => a.lastAccessed - b.lastAccessed);
        const entriesToDelete = sortedEntries.slice(maxEntries);
        
        for (const entry of entriesToDelete) {
          await ctx.db.delete(entry._id);
        }
        
        console.log(`🗑️ [CACHE] Cleaned up ${entriesToDelete.length} old cache entries for user ${args.userId}`);
      }
    } catch (error) {
      console.error(`❌ [CACHE] Error cleaning up old entries:`, error);
    }
  },
});
