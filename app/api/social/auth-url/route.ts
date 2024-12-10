import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.group('Auth URL Generation');
  
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const headers = Object.fromEntries(request.headers.entries());
  
  console.log('Request details:', {
    platform,
    headers,
    url: request.url
  });

  try {
    if (platform === 'instagram') {
      const clientId = process.env.INSTAGRAM_CLIENT_ID;
      const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

      if (!clientId || !redirectUri) {
        throw new Error('Missing Instagram configuration');
      }

      const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=basic,instagram_basic,instagram_content_publish&response_type=code`;
      
      console.log('Generated Instagram auth URL');
      return NextResponse.json({ authUrl });
    }
    
    if (platform === 'youtube') {
      console.log('Processing YouTube request');
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri = process.env.YOUTUBE_REDIRECT_URI;

      console.log('Config check:', {
        hasClientId: !!clientId,
        hasRedirectUri: !!redirectUri,
        redirectUri
      });

      if (!clientId || !redirectUri) {
        throw new Error('Missing YouTube configuration');
      }

      const scope = [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.force-ssl'
      ].join(' ');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `scope=${scope}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent`;

      console.log('Generated YouTube auth URL');
      return NextResponse.json({ authUrl });
    }

    throw new Error(`Unsupported platform: ${platform}`);
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