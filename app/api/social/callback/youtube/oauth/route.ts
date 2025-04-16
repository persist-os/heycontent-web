export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Initialize Convex client with better error handling
let convex: ConvexHttpClient;
try {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is not defined');
  }
  convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
  console.log('Convex client initialized with URL:', process.env.NEXT_PUBLIC_CONVEX_URL);
} catch (error) {
  console.error('Failed to initialize Convex client:', error);
  convex = new ConvexHttpClient('https://impossible-to-connect.convex.cloud'); // This will fail gracefully later
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=missing_params`)
    }

    // Decode state parameter
    const { userId, platform } = JSON.parse(Buffer.from(state, 'base64').toString())

    // Verify that we have a userId in the state
    if (!userId) {
      console.error('No userId in state parameter');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_state`);
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    )

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Get token info to verify scopes
    const tokenInfo = await oauth2Client.getTokenInfo(tokens.access_token!)
    console.log('Token Info:', {
      scopes: tokenInfo.scopes,
      email: tokenInfo.email,
      expiryDate: tokenInfo.expiry_date
    })

    // Verify we have the required YouTube scopes
    const requiredScopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.force-ssl'
    ];

    const hasRequiredScopes = requiredScopes.every(scope =>
      tokenInfo.scopes?.includes(scope)
    );

    if (!hasRequiredScopes) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=insufficient_scopes`)
    }

    // Get YouTube channel info
    const youtube = google.youtube('v3')
    const response = await youtube.channels.list({
      auth: oauth2Client,
      part: ['snippet', 'statistics'],
      mine: true
    })

    const channel = response.data.items?.[0]
    if (!channel) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_channel`)
    }

    // Store YouTube data in Convex with better error handling
    // This will update both youtubeData and socialAccounts tables
    console.log('Saving YouTube channel data:', {
      channelId: channel.id,
      title: channel.snippet?.title,
      statistics: channel.statistics ? {
        subscriberCount: channel.statistics.subscriberCount,
        videoCount: channel.statistics.videoCount,
        viewCount: channel.statistics.viewCount
      } : 'No statistics'
    });

    try {
      const youtubeDataId = await convex.mutation(api.youtube.storeYouTubeData, {
        userId,
        channelData: {
          id: channel.id,
          snippet: channel.snippet,
          statistics: channel.statistics,
          profileUrl: `https://youtube.com/channel/${channel.id}`,
          avatarUrl: channel.snippet?.thumbnails?.default?.url,
        },
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
        tokenType: tokens.token_type!,
        scope: tokens.scope!,
      });
      console.log('YouTube data saved successfully to Convex, ID:', youtubeDataId);
    } catch (convexError) {
      console.error('Error saving YouTube data to Convex:', convexError);
      throw new Error(`Convex mutation failed: ${convexError instanceof Error ? convexError.message : 'Unknown error'}`);
    }

    // Store token in Convex tokens table with better error handling
    try {
      const tokenId = await convex.mutation(api.tokens.save, {
        userId,
        platform: 'youtube',
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : Date.now() + 3600 * 1000, // Default 1 hour if no expiry
        scope: tokens.scope
      });
      console.log('Token saved successfully to Convex, ID:', tokenId);
    } catch (tokenError) {
      console.error('Error saving token to Convex:', tokenError);
      throw new Error(`Convex token mutation failed: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`);
    }

    // Explicitly update connection status as a fallback
    try {
      await convex.mutation(api.social.updateConnectionStatus, {
        userId,
        platform: 'youtube',
        isConnected: true
      });
      console.log('Connection status updated successfully');
    } catch (statusError) {
      console.error('Error updating connection status:', statusError);
      // Don't throw here, as we've already saved the main data
    }

    // Note: Connection status is already updated by storeYouTubeData

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=youtube_connected`)

  } catch (error) {
    console.error('[YOUTUBE_CALLBACK_ERROR]', error);

    // Determine the specific error type for better debugging
    let errorType = 'unknown';
    let errorDetails = '';

    if (error instanceof Error) {
      errorDetails = error.message;

      if (error.message.includes('Convex')) {
        errorType = 'convex_error';
      } else if (error.message.includes('token')) {
        errorType = 'token_error';
      } else if (error.message.includes('YouTube')) {
        errorType = 'youtube_api_error';
      }
    }

    console.error(`Error type: ${errorType}, Details: ${errorDetails}`);

    // Log additional debugging information
    console.log('Environment variables check:', {
      NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL ? 'Set' : 'Not set',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
      YOUTUBE_REDIRECT_URI: process.env.YOUTUBE_REDIRECT_URI ? 'Set' : 'Not set'
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=${errorType}&details=${encodeURIComponent(errorDetails)}`)
  }
}