import { v } from "convex/values";
import { query } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

interface YouTubeToken {
  accessToken: string;
  expiresAt: number;
  tokenType: string;
  scope: string[];
}

interface TokenDocument {
  _id: Id<"tokens">;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
  scope: string[];
  lastRefreshed?: number;
}

// Updated Interface matching schema.ts
interface YouTubeVideoDataSchema {
  id: string; // YouTube ID (channel or video)
  videoId?: string; // Explicit video ID field
  snippet?: { // Optional
    publishedAt?: string; // Optional ISO 8601 string
    title: string;
    description: string;
    customUrl?: string; // Optional
    thumbnails?: { // Optional
      default?: { url: string; width: number; height: number; }; // Optional
      medium?: { url: string; width: number; height: number; }; // Optional
      high?: { url: string; width: number; height: number; }; // Optional
    };
  };
  statistics?: { // Optional
    viewCount: string; // String type
    subscriberCount: string; // String type
    hiddenSubscriberCount: boolean;
    videoCount: string; // String type
    // likeCount and commentCount are NOT in schema's statistics
  };
  analysisData?: any; // Optional based on schema
  // Other fields like accessToken etc. are also optional in schema but likely not needed for this query
}

// Get YouTube data for a user
export const getYouTubeData = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      const youtubeData = await ctx.db
        .query("youtubeData")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .order("desc")
        .first();

      if (!youtubeData) {
        return null;
      }

      // Also get the social account data for consistency
      const socialAccount = await ctx.db
        .query("socialAccounts")
        .filter((q) =>
          q.eq(q.field("userId"), args.userId) &&
          q.eq(q.field("platform"), "youtube")
        )
        .first();

      return {
        ...youtubeData,
        socialAccount: socialAccount || null
      };
    } catch (error) {
      console.error('Error getting YouTube data:', error);
      throw new Error(`Failed to get YouTube data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Check YouTube connection status
export const getYouTubeConnectionStatus = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const status = await ctx.db
      .query("socialConnectionStatus")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return status?.connections.youtube ?? false;
  },
});

// Get video data
export const getVideoData = query({
  args: { userId: v.string(), videoId: v.string() },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("youtubeData")
      .withIndex("by_user_resource", (q) =>
        q.eq("userId", args.userId).eq("resourceType", "video")
      )
      .filter((q) => q.eq(q.field("data.videoId"), args.videoId))
      .order("desc")
      .first();

    return data;
  },
});

// Get YouTube credentials with automatic refresh
// NOTE: Moved refreshYouTubeToken helper function to convex/youtubeHelpers.ts
// as it uses Node.js APIs (googleapis)
export const get_youtube_credentials = query({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<YouTubeToken | null> => {
    try {
      const token = await ctx.runQuery(api.tokens.get, {
        userId: args.userId,
        platform: "youtube"
      }) as TokenDocument | null;

      if (!token) {
        return null;
      }

      // Check if token needs refresh
      const now = Date.now();
      if (token.expiresAt <= now + 300000) { // 5 minutes before expiry
        if (!token.refreshToken) {
          // If no refresh token, we can't refresh. Return null or expired token info.
          console.warn(`Token for user ${args.userId} expired, no refresh token available.`);
          // Returning null indicates credentials aren't valid/available
          return null; 
          // Alternatively, could throw an error or return an object indicating expiry
          // throw new Error("Token expired and no refresh token available"); 
        }

        // IMPORTANT: We cannot call refreshYouTubeToken (Node.js function) directly from a query.
        // The client/action calling this query needs to handle the refresh.
        // We return the current (potentially expired) token info along with refresh needed flag.
        return {
          accessToken: token.accessToken,
          expiresAt: token.expiresAt,
          tokenType: token.tokenType,
          scope: token.scope,
          needsRefresh: true, // Add a flag indicating refresh is needed
          refreshToken: token.refreshToken // Include refresh token for the caller
        } as any; // Cast to any to include extra fields for now
      }

      // Token is valid
      return {
        accessToken: token.accessToken,
        expiresAt: token.expiresAt,
        tokenType: token.tokenType,
        scope: token.scope,
        needsRefresh: false
      } as any; // Cast to any to include extra fields for now

    } catch (error) {
      console.error('Error getting YouTube credentials:', error);
      throw new Error(`Failed to get YouTube credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Updated Query: List YouTube Videos for a User
export const listUserYouTubeVideos = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const videoDocs = await ctx.db
      .query("youtubeData")
      .withIndex("by_user_resource", (q) =>
        q.eq("userId", args.userId).eq("resourceType", "video")
      )
      .order("desc") // Order by Convex document creation time descending
      .collect();

    return videoDocs.map((doc) => {
      // Use the updated interface based on schema
      const data = doc.data as YouTubeVideoDataSchema;
      const metrics = data.statistics;
      const content = data.snippet;

      // Handle potential missing data due to optional fields
      const viewCount = Number(metrics?.viewCount || 0);
      // Likes and Comments are NOT available in schema's statistics object
      const likes = 0; // Cannot get from metrics
      const comments = 0; // Cannot get from metrics

      // Engagement calculation is not possible without likes/comments
      const engagement = 0; // Placeholder

      return {
        // Use data.videoId if available, otherwise fallback to data.id (needs verification)
        id: data.videoId || data.id,
        platform: 'youtube',
        type: 'video',
        content: {
          text: content?.title || 'Untitled Video', // Provide fallback
          // Use optional chaining and provide fallback
          thumbnail: content?.thumbnails?.medium?.url || content?.thumbnails?.default?.url || undefined,
        },
        metrics: {
          views: viewCount,
          engagement: engagement, // Set to 0 or remove if not meaningful
          likes: likes, // Set to 0 or remove
          comments: comments, // Set to 0 or remove
          shares: undefined, // Shares still not available
        },
        performance: {
          // Performance trend calculation requires historical data or comparison logic
          trend: 'stable',
          percentageChange: 0,
        },
        // Use optional chaining for publishedAt
        publishedAt: content?.publishedAt || new Date(doc._creationTime).toISOString(), // Fallback to doc creation time
        _creationTime: doc._creationTime,
      };
    }).filter(item => item.id); // Ensure items have an ID
  },
}); 