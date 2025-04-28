"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { google } from 'googleapis';
import { Id } from "./_generated/dataModel";

interface YouTubeToken {
  accessToken: string;
  expiresAt: number;
  tokenType: string;
  scope: string[];
}

// Action to refresh YouTube token using Node.js
export const refreshAndStoreYoutubeToken = action({
  args: {
    userId: v.string(),
    refreshToken: v.string(),
  },
  handler: async (ctx, args): Promise<YouTubeToken> => {
    const { userId, refreshToken } = args;

    console.log(`Attempting to refresh YouTube token for user: ${userId}`);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      // Redirect URI might not be strictly needed for refresh, but good practice
      process.env.YOUTUBE_REDIRECT_URI 
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      const newAccessToken = credentials.access_token!;
      const newExpiresAt = credentials.expiry_date!;
      const newTokenType = credentials.token_type!;
      const newScope = credentials.scope?.split(' ') || [];

      console.log(`Successfully refreshed YouTube token for user: ${userId}`);

      // Store the new token details using the mutation
      await ctx.runMutation(api.youtubeMutations.update_youtube_token, {
        userId,
        accessToken: newAccessToken,
        // Note: Google might sometimes return a new refresh token, but often doesn't.
        // We are not passing the old one here; update_youtube_token expects optional.
        // If credentials.refresh_token exists, you might want to store it.
        expiresAt: newExpiresAt,
        tokenType: newTokenType,
        scope: newScope,
      });

      console.log(`Successfully stored refreshed YouTube token for user: ${userId}`);

      return {
        accessToken: newAccessToken,
        expiresAt: newExpiresAt,
        tokenType: newTokenType,
        scope: newScope
      };
    } catch (error: any) {
      console.error(`Error refreshing YouTube token for user ${userId}:`, error);
      // Check if the error indicates the refresh token is invalid (e.g., revoked access)
      if (error.response?.data?.error === 'invalid_grant') {
        console.warn(`Refresh token invalid for user ${userId}. Disconnecting YouTube.`);
        // Optional: Automatically disconnect the account if refresh fails due to invalid grant
        try {
          await ctx.runMutation(api.youtubeMutations.disconnectYouTube, { userId });
        } catch (disconnectError) {
          console.error(`Failed to auto-disconnect YouTube for user ${userId} after invalid grant:`, disconnectError);
        }
        throw new Error("Refresh token is invalid. User needs to re-authenticate.");
      }
      throw new Error(`Failed to refresh YouTube token: ${error.message || 'Unknown error'}`);
    }
  },
}); 