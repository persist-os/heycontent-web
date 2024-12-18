import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SocialPlatform } from '@/types/social-platforms';

export const dynamic = 'force-dynamic';

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
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.YOUTUBE_REDIRECT_URI!,
    scope: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.force-ssl'
    ]
  },
  gmail: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/gmail`,
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.labels'
    ]
  }
}

export async function GET(request: Request) {
  console.group('Auth URL Generation');
  
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') as SocialPlatform;
  
  console.log('Request details:', {
    platform,
    url: request.url
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const config = PLATFORM_CONFIGS[platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    if (!config.clientId || !config.redirectUri) {
      throw new Error(`Missing configuration for ${platform}`);
    }

    const state = Buffer.from(JSON.stringify({
      userId: session.user.id,
      platform
    })).toString('base64');

    let authUrl: string;
    switch (platform) {
      case 'youtube':
      case 'gmail':
        console.log('YouTube/Gmail auth config:', {
          clientId: config.clientId,
          redirectUri: config.redirectUri,
          scope: config.scope
        });
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${config.clientId}&` +
          `redirect_uri=${config.redirectUri}&` +
          `scope=${config.scope.join(' ')}&` +
          `response_type=code&` +
          `access_type=offline&` +
          `prompt=consent&` +
          `state=${state}`;
        console.log('Generated auth URL:', authUrl);
        break;
      case 'instagram':
        authUrl = `https://api.instagram.com/oauth/authorize?` +
          `client_id=${config.clientId}&` +
          `redirect_uri=${config.redirectUri}&` +
          `scope=${config.scope.join(',')}&` +
          `response_type=code&` +
          `state=${state}`;
        break;
      case 'tiktok':
        authUrl = `https://www.tiktok.com/auth/authorize?` +
          `client_key=${config.clientId}&` +
          `redirect_uri=${config.redirectUri}&` +
          `scope=${config.scope.join(',')}&` +
          `response_type=code&` +
          `state=${state}`;
        break;
      default:
        throw new Error(`Invalid platform: ${platform}`);
    }

    console.log(`Generated ${platform} auth URL`);
    return NextResponse.json({ authUrl });

  } catch (error) {
    console.error('Auth URL error:', {
      error,
      platform,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  } finally {
    console.groupEnd();
  }
} 