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