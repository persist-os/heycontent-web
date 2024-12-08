import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { SocialPlatform } from '@/types/social-platforms'

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
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
  },
  gmail: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  outlook: {
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    clientId: process.env.OUTLOOK_CLIENT_ID,
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
  }
}

const API_ENDPOINTS: Record<SocialPlatform, string> = {
  instagram: 'https://graph.instagram.com/me?fields=id,username,account_type',
  tiktok: 'https://open-api.tiktok.com/user/info/',
  youtube: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
  gmail: 'https://gmail.googleapis.com/gmail/v1/users/me/profile',
  outlook: 'https://graph.microsoft.com/v1.0/me'
}

async function exchangeCodeForToken(platform: SocialPlatform, code: string, redirectUri: string) {
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
  const response = await fetch(API_ENDPOINTS[platform], {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  return response.json()
}

export async function GET(
  req: Request,
  { params }: { params: { platform: SocialPlatform } }
) {
  try {
    const { searchParams } = new URL(req.url)
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
        username: profile.username || profile.name || 'unknown',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in 
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        isConnected: true,
        userId
      },
      update: {
        username: profile.username || profile.name || 'unknown',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in 
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
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