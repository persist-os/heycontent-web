import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import { prisma } from '@/lib/db'
import { SocialPlatform } from '@/types/social-platforms'

// Platform-specific OAuth configurations
const PLATFORM_CONFIGS: Record<SocialPlatform, {
  clientId: string | undefined;
  clientSecret: string | undefined;
  redirectUri: string;
  scope: string[];
}> = {
  instagram: {
    clientId: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/instagram`,
    scope: ['user_profile', 'user_media']
  },
  tiktok: {
    clientId: process.env.TIKTOK_CLIENT_ID,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/tiktok`,
    scope: ['user.info.basic', 'video.list']
  },
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/youtube`,
    scope: ['https://www.googleapis.com/auth/youtube.readonly']
  },
  gmail: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/gmail`,
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/gmail.modify'  // For marking emails as read/important
    ]
  },
  outlook: {
    clientId: process.env.OUTLOOK_CLIENT_ID,
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/outlook`,
    scope: [
      'Mail.Read',
      'Mail.ReadWrite',
      'Mail.Send',
      'User.Read'
    ]
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { platform } = body as { platform: SocialPlatform }

    if (!PLATFORM_CONFIGS[platform]) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    // Generate OAuth URL for the platform
    const config = PLATFORM_CONFIGS[platform]
    const state = Buffer.from(JSON.stringify({
      userId: session.user.id,
      platform
    })).toString('base64')

    let authUrl: string
    switch (platform) {
      case 'gmail':
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${config.redirectUri}&scope=${config.scope.join(' ')}&response_type=code&access_type=offline&prompt=consent&state=${state}`
        break
      case 'outlook':
        authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${config.clientId}&redirect_uri=${config.redirectUri}&scope=${config.scope.join(' ')}&response_type=code&state=${state}`
        break
      case 'instagram':
        authUrl = `https://api.instagram.com/oauth/authorize?client_id=${config.clientId}&redirect_uri=${config.redirectUri}&scope=${config.scope.join(',')}&response_type=code&state=${state}`
        break
      case 'tiktok':
        authUrl = `https://www.tiktok.com/auth/authorize?client_key=${config.clientId}&redirect_uri=${config.redirectUri}&scope=${config.scope.join(',')}&response_type=code&state=${state}`
        break
      case 'youtube':
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${config.redirectUri}&scope=${config.scope.join(' ')}&response_type=code&access_type=offline&state=${state}`
        break
      default:
        return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    return NextResponse.json({ authUrl })

  } catch (error) {
    console.error('[SOCIAL_CONNECT_ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 