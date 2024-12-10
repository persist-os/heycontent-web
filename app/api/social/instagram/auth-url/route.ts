import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      throw new Error('Missing Instagram configuration');
    }

    // Using the basic scope for Instagram Basic Display API
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=basic,instagram_basic,instagram_content_publish&response_type=code`;
    
    console.log('Generated auth URL:', authUrl);
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Auth URL error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate auth URL' }, 
      { status: 500 }
    );
  }
}

