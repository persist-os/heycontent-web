import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { SocialPlatform } from '@/app/types/social-platforms'
import { google } from 'googleapis'

const PLATFORM_CONFIGS: Record<SocialPlatform, {
  tokenUrl: string;
  clientId: string | undefined;
  clientSecret: string | undefined;
}> = {
  instagram: {
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    clientId: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
  },
  tiktok: {
    tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
    clientId: process.env.TIKTOK_CLIENT_ID,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
  },
  youtube: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  gmail: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }
}

const API_ENDPOINTS: Record<SocialPlatform, string> = {
  instagram: 'https://graph.instagram.com/me?fields=id,username,account_type',
  tiktok: 'https://open-api.tiktok.com/user/info/',
  youtube: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
  gmail: 'https://gmail.googleapis.com/gmail/v1/users/me/profile'
}

async function exchangeCodeForToken(platform: SocialPlatform, code: string, redirectUri: string) {
  if (platform === 'gmail' || platform === 'youtube') {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    )
    const { tokens } = await oauth2Client.getToken(code)
    return tokens
  }

  const platformConfig = PLATFORM_CONFIGS[platform]
  
  const response = await fetch(platformConfig.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: platformConfig.clientId!,
      client_secret: platformConfig.clientSecret!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })
  })

  return response.json()
}

async function fetchUserProfile(platform: SocialPlatform, accessToken: string) {
  if (platform === 'gmail') {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })
    const gmail = google.gmail('v1')
    const profile = await gmail.users.getProfile({
      auth: oauth2Client,
      userId: 'me'
    })
    return profile.data
  }

  if (platform === 'youtube') {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })
    const youtube = google.youtube('v3')
    const response = await youtube.channels.list({
      auth: oauth2Client,
      part: ['snippet,statistics'],
      mine: true
    })
    return response.data.items?.[0]
  }

  const response = await fetch(API_ENDPOINTS[platform], {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  return response.json()
}

export async function GET(
  request: Request,
  { params }: { params: { platform: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=missing_params`)
    }

    // Decode state parameter
    const { userId, platform } = JSON.parse(Buffer.from(state, 'base64').toString())

    // Exchange code for access token
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/${platform}`
    const tokenData = await exchangeCodeForToken(platform as SocialPlatform, code, redirectUri)

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=token_exchange`)
    }

    // Fetch user profile from the platform
    const profile = await fetchUserProfile(platform as SocialPlatform, tokenData.access_token)

    // Save or update social account in database
    await prisma.socialAccount.upsert({
      where: {
        userId_platform: {
          userId,
          platform
        }
      },
      create: {
        platform,
        username: platform === 'gmail' ? profile.emailAddress : profile.username || profile.name || 'unknown',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in 
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        tokenType: tokenData.token_type,
        scope: tokenData.scope,
        metadata: platform === 'gmail' ? {
          emailAddress: profile.emailAddress,
          messagesTotal: profile.messagesTotal,
          threadsTotal: profile.threadsTotal,
          historyId: profile.historyId
        } : platform === 'youtube' ? {
          channelId: profile.id,
          subscribers: profile.statistics?.subscriberCount,
          videos: profile.statistics?.videoCount,
          views: profile.statistics?.viewCount
        } : profile,
        isConnected: true,
        userId
      },
      update: {
        username: platform === 'gmail' ? profile.emailAddress : profile.username || profile.name || 'unknown',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in 
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        tokenType: tokenData.token_type,
        scope: tokenData.scope,
        metadata: platform === 'gmail' ? {
          emailAddress: profile.emailAddress,
          messagesTotal: profile.messagesTotal,
          threadsTotal: profile.threadsTotal,
          historyId: profile.historyId
        } : platform === 'youtube' ? {
          channelId: profile.id,
          subscribers: profile.statistics?.subscriberCount,
          videos: profile.statistics?.videoCount,
          views: profile.statistics?.viewCount
        } : profile,
        isConnected: true
      }
    })

    // Redirect back to settings page with success message
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=connected`)

  } catch (error) {
    console.error('[SOCIAL_CALLBACK_ERROR]', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=unknown`)
  }
} 