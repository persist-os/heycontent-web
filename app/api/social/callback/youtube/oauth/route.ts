export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import prisma from '@/app/lib/prisma'
import { google } from 'googleapis'

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
      'https://www.googleapis.com/auth/youtube.readonly',  // Basic read-only access
      'https://www.googleapis.com/auth/youtube.force-ssl'  // Required for secure API access
    ];

    const hasRequiredScopes = requiredScopes.every(scope => 
      tokenInfo.scopes?.includes(scope)
    );

    if (!hasRequiredScopes) {
      console.error('Missing required YouTube scopes:', {
        required: requiredScopes,
        granted: tokenInfo.scopes,
        missing: requiredScopes.filter(scope => !tokenInfo.scopes?.includes(scope))
      });
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=insufficient_youtube_permissions`);
    }

    // Initialize YouTube API
    const youtube = google.youtube('v3')

    // Get channel information
    const channelResponse = await youtube.channels.list({
      auth: oauth2Client,
      part: ['snippet,statistics'],
      mine: true
    })

    const channel = channelResponse.data.items?.[0]
    if (!channel) {
      throw new Error('No YouTube channel found')
    }

    // Save or update social account in database
    await prisma.socialAccount.upsert({
      where: {
        userId_platform: {
          userId,
          platform: 'youtube'
        }
      },
      create: {
        platform: 'youtube',
        username: channel.snippet?.title || 'unknown',
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        tokenType: tokens.token_type,
        scope: tokens.scope,
        profileUrl: `https://youtube.com/channel/${channel.id}`,
        avatarUrl: channel.snippet?.thumbnails?.default?.url,
        metadata: {
          channelId: channel.id,
          subscribers: channel.statistics?.subscriberCount,
          videos: channel.statistics?.videoCount,
          views: channel.statistics?.viewCount
        },
        isConnected: true,
        userId
      },
      update: {
        username: channel.snippet?.title || 'unknown',
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        tokenType: tokens.token_type,
        scope: tokens.scope,
        profileUrl: `https://youtube.com/channel/${channel.id}`,
        avatarUrl: channel.snippet?.thumbnails?.default?.url,
        metadata: {
          channelId: channel.id,
          subscribers: channel.statistics?.subscriberCount,
          videos: channel.statistics?.videoCount,
          views: channel.statistics?.viewCount
        },
        isConnected: true
      }
    })

    // Redirect back to settings page with success message
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=youtube_connected`)

  } catch (error) {
    console.error('[YOUTUBE_CALLBACK_ERROR]', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=youtube_connection_failed`)
  }
}