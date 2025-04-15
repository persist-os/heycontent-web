export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { google } from 'googleapis'
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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

    // Store YouTube data in Convex
    await convex.mutation(api.youtube.storeYouTubeData, {
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

    // Update connection status
    await convex.mutation(api.social.updateConnectionStatus, {
      userId,
      platform: 'youtube',
      isConnected: true,
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=youtube_connected`)

  } catch (error) {
    console.error('[YOUTUBE_CALLBACK_ERROR]', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=unknown`)
  }
}