export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { YOUTUBE_CONFIG } from '@/app/lib/config/youtube';

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
    const hasRequiredScopes = YOUTUBE_CONFIG.REQUIRED_SCOPES.every(scope =>
      tokenInfo.scopes?.includes(scope)
    );

    if (!hasRequiredScopes) {
      console.error('Missing required scopes:', {
        required: YOUTUBE_CONFIG.REQUIRED_SCOPES,
        granted: tokenInfo.scopes
      });
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
      await convex.mutation(api.youtube.storeYouTubeData, {
        userId,
        channelData: channel,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: tokens.expiry_date || undefined,
        tokenType: tokens.token_type!,
        scope: tokenInfo.scopes?.join(' ') || ''
      });

      console.log('Successfully stored YouTube data');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=youtube_connected`);
    } catch (error) {
      console.error('Failed to store YouTube data:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=store_failed`);
    }
  } catch (error) {
    console.error('YouTube OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_failed`);
  }
}