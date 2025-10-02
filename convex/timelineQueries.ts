import { query } from './_generated/server'
import { v } from 'convex/values'

/**
 * Single bundled query for all timeline data to improve performance
 * Replaces 13+ separate queries with one optimized call
 * Always includes analytics data
 */
export const getTimelineData = query({
  args: { 
    userId: v.string()
  },
  handler: async (ctx, { userId }) => {
    // Core timeline data (always fetch)
    const [conversations, notes, crystals, crystal_shards] = await Promise.all([
      // Chat conversations
      ctx.db
        .query('conversations')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .order('desc')
        .take(100), // Limit for performance
      
      // Notes
      ctx.db
        .query('notes')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .order('desc')
        .take(100), // Limit for performance
      
      // Crystals (replaced old personas and social media)
      ctx.db
        .query('crystals')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .order('desc')
        .take(50), // Limit for performance

      // Crystal shards (detailed persona insights)
      ctx.db
        .query('crystal_shards')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .order('desc')
        .take(100) // Limit for performance
    ])

    return {
      // Core timeline data
      conversations,
      notes,
      crystals, // Crystal system replaces old personas and social media
      crystal_shards, // Detailed insights and patterns
      
      // Metadata
      fetchedAt: Date.now()
    }
  }
}) 