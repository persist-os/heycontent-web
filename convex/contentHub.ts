import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Type for content hub insights
export interface ContentHubInsight {
  remix_insight: string;
  youtube_hook: string;
  youtube_format: string;
  youtube_cta: string;
  instagram_hook: string;
  instagram_format: string;
  instagram_cta: string;
  gmail_hook: string;
  gmail_format: string;
  gmail_cta: string;
  smartnote_summary: string;
  conversation_starter: string;
}

// Type for the stored document
export interface ContentHubDocument extends Doc<'contentHubInsights'> {
  userId: string;
  insight: ContentHubInsight;
  createdAt: number;
  updatedAt: number;
}

/**
 * Get all content hub insights for a user, ordered by most recent first
 */
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<ContentHubDocument[]> => {
    const insights = await ctx.db
      .query('contentHubInsights')
      .withIndex('by_userId', q => q.eq('userId', args.userId))
      .order('desc')
      .collect();
    return insights;
  },
});

/**
 * Get the most recent content hub insight for a user
 */
export const getMostRecentByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<ContentHubDocument | null> => {
    const insights = await ctx.db
      .query('contentHubInsights')
      .withIndex('by_userId', q => q.eq('userId', args.userId))
      .order('desc')
      .collect();
    if (insights.length > 0) {
      return insights[0];
    }
    return null;
  },
});

/**
 * Create a new content hub insight for a user
 */
export const createContentHubInsight = mutation({
  args: {
    userId: v.string(),
    insight: v.object({
      remix_insight: v.string(),
      youtube_hook: v.string(),
      youtube_format: v.string(),
      youtube_cta: v.string(),
      instagram_hook: v.string(),
      instagram_format: v.string(),
      instagram_cta: v.string(),
      gmail_hook: v.string(),
      gmail_format: v.string(),
      gmail_cta: v.string(),
      smartnote_summary: v.string(),
      conversation_starter: v.string(),
    }),
  },
  handler: async (ctx, args): Promise<Id<'contentHubInsights'>> => {
    const now = Date.now();
    const insightId = await ctx.db.insert('contentHubInsights', {
      userId: args.userId,
      insight: args.insight,
      createdAt: now,
      updatedAt: now,
    });
    return insightId;
  },
});

/**
 * Get content hub data bundle for a user (Instagram, YouTube, Gmail data)
 * Enhanced to include analysis data from all three platforms using existing queries
 */
export const getContentHubDataBundle = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userId = args.userId;
    
    console.log(`[getContentHubDataBundle] Starting enhanced data fetch for userId: ${userId}`);
    
    // Check platform connections by looking for tokens/credentials
    let instagramConnected = false;
    let youtubeConnected = false;
    let gmailConnected = false;

    // Check Instagram connection
    try {
      const instagramToken = await ctx.db
        .query("instagramTokens")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .first();
      instagramConnected = !!instagramToken;
      console.log(`[getContentHubDataBundle] Instagram connected: ${instagramConnected}`);
    } catch (e) {
      console.error("Error checking Instagram connection:", e);
      instagramConnected = false;
    }

    // Check YouTube connection
    try {
      const youtubeToken = await ctx.db
        .query("youtubeTokens")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .first();
      youtubeConnected = !!youtubeToken;
      console.log(`[getContentHubDataBundle] YouTube connected: ${youtubeConnected}`);
    } catch (e) {
      console.error("Error checking YouTube connection:", e);
      youtubeConnected = false;
    }

    // Check Gmail connection
    try {
      const gmailToken = await ctx.db
        .query("gmailTokens")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .first();
      gmailConnected = !!gmailToken;
      console.log(`[getContentHubDataBundle] Gmail connected: ${gmailConnected}`);
    } catch (e) {
      console.error("Error checking Gmail connection:", e);
      gmailConnected = false;
    }

    // Enhanced Instagram data fetch using existing queries
    let instagramData: any[] = [];
    let instagramAnalysis: any = null;
    if (instagramConnected) {
      try {
        // Get 3 most recent posts using existing query
        const instagramPosts = await ctx.runQuery(api.instagramQueries.getRecentPostsWithAnalysis, { userId });
        
        // Get Instagram batch analysis using existing query
        const instagramAccount = await ctx.db
          .query("instagramAccounts")
          .withIndex("by_userId", q => q.eq("userId", userId))
          .first();
        
        if (instagramAccount) {
          instagramAnalysis = await ctx.runQuery(api.instagramQueries.getInstagramBatchAnalysis, {
            userId,
            instagramAccountId: instagramAccount.instagramAccountId
          });
        }
        
        instagramData = instagramPosts;
        console.log(`[getContentHubDataBundle] Instagram data: ${instagramPosts.length} posts, analysis: ${!!instagramAnalysis}`);
      } catch (e) {
        console.error("Error fetching Instagram data:", e);
        instagramData = [];
      }
    }

    // Enhanced YouTube data fetch using existing queries
    let youtubeData: any[] = [];
    let youtubeAnalysis: any = null;
    if (youtubeConnected) {
      try {
        // Get 3 most recent videos using existing query
        const youtubeVideos = await ctx.runQuery(api.youtubeQueries.getRecentVideosWithAnalysis, { userId });
        
        // Get channel analysis if available
        const youtubeChannel = await ctx.db
          .query("youtubeChannels")
          .withIndex("by_userId", q => q.eq("userId", userId))
          .first();
        
        if (youtubeChannel && youtubeChannel.analysis) {
          youtubeAnalysis = youtubeChannel.analysis;
        }
        
        youtubeData = youtubeVideos;
        console.log(`[getContentHubDataBundle] YouTube data: ${youtubeVideos.length} videos, analysis: ${!!youtubeAnalysis}`);
      } catch (e) {
        console.error("Error fetching YouTube data:", e);
        youtubeData = [];
      }
    }

    // Enhanced Gmail data fetch using existing queries
    let gmailData: any[] = [];
    let gmailAnalysis: any = null;
    if (gmailConnected) {
      try {
        // Get 3 most recent threads using new query
        const gmailThreads = await ctx.runQuery(api.gmailQueries.getRecentThreadsForContentHub, { userId });
        
        // Get Gmail batch analysis using existing query
        const gmailAccount = await ctx.db
          .query("gmailAccounts")
          .withIndex("by_userId", q => q.eq("userId", userId))
          .first();
        
        if (gmailAccount) {
          gmailAnalysis = await ctx.runQuery(api.gmailQueries.getGmailBatchAnalysis, {
            userId,
            gmailAccountId: gmailAccount.email
          });
        }
        
        gmailData = gmailThreads;
        console.log(`[getContentHubDataBundle] Gmail data: ${gmailThreads.length} threads, analysis: ${!!gmailAnalysis}`);
      } catch (e) {
        console.error("Error fetching Gmail data:", e);
        gmailData = [];
      }
    }

    // Get platform connection status
    const platforms = {
      instagram: instagramConnected,
      youtube: youtubeConnected,
      gmail: gmailConnected
    };

    const connectedPlatforms = Object.entries(platforms)
      .filter(([_, connected]) => connected)
      .map(([platform, _]) => platform);

    console.log(`[getContentHubDataBundle] Enhanced data bundle complete:`, {
      connectedPlatforms,
      instagramItems: instagramData.length,
      youtubeItems: youtubeData.length,
      gmailItems: gmailData.length,
      hasInstagramAnalysis: !!instagramAnalysis,
      hasYoutubeAnalysis: !!youtubeAnalysis,
      hasGmailAnalysis: !!gmailAnalysis
    });

    return {
      instagram: {
        posts: instagramData,
        analysis: instagramAnalysis,
        connected: platforms.instagram
      },
      youtube: {
        videos: youtubeData,
        analysis: youtubeAnalysis,
        connected: platforms.youtube
      },
      gmail: {
        threads: gmailData,
        analysis: gmailAnalysis,
        connected: platforms.gmail
      },
      connectedPlatforms,
      platformCount: connectedPlatforms.length,
      instagramConnected: platforms.instagram,
      youtubeConnected: platforms.youtube,
      gmailConnected: platforms.gmail,
      minimumPlatformsConnected: connectedPlatforms.length >= 2
    };
  },
}); 