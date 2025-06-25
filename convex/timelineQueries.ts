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
    const [conversations, notes, personas] = await Promise.all([
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
      
      // Personas
      ctx.db
        .query('personas')
        .withIndex('by_userId', (q) => q.eq('userId', userId))
        .order('desc')
        .collect()
    ])

    // Content data (social media posts)
    const [instagramPosts, youtubeVideos] = await Promise.all([
      // Instagram posts
      ctx.db
        .query('instagramPosts')
        .withIndex('by_userId', (q) => q.eq('userId', userId))
        .order('desc')
        .take(50), // Limit for performance
      
      // YouTube videos
      ctx.db
        .query('youtubeVideos')
        .withIndex('by_userId', (q) => q.eq('userId', userId))
        .order('desc')
        .take(50) // Limit for performance
    ])

    // Analytics data (always fetch as requested)
    const [instagramAccount, youtubeChannel] = await Promise.all([
      ctx.db
        .query('instagramAccounts')
        .withIndex('by_userId', (q) => q.eq('userId', userId))
        .first(),
      
      ctx.db
        .query('youtubeChannels')
        .withIndex('by_userId', (q) => q.eq('userId', userId))
        .first()
    ])

    // Fetch batch analysis if accounts exist
    const [instagramAnalytics, youtubeAnalytics] = await Promise.all([
      instagramAccount 
        ? ctx.db
            .query('instagramBatchAnalysis')
            .withIndex('by_userId', (q) => q.eq('userId', userId))
            .first()
        : null,
      
      youtubeChannel
        ? ctx.db
            .query('youtubeBatchAnalysis') 
            .withIndex('by_userId', (q) => q.eq('userId', userId))
            .first()
        : null
    ])

    const analyticsData = {
      instagramAccount,
      youtubeChannel,
      instagramAnalytics,
      youtubeAnalytics
    }

    return {
      // Core timeline data
      conversations,
      notes,
      personas,
      
      // Content data
      instagramPosts,
      youtubeVideos,
      
      // Analytics data (always included)
      analytics: analyticsData,
      
      // Metadata
      fetchedAt: Date.now()
    }
  }
}) 