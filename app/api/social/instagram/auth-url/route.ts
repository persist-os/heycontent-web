import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const clientId = process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_CLIENT_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      throw new Error('Missing Facebook/Instagram configuration');
    }

    // Using correct Facebook Login permissions for Instagram
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=public_profile,pages_show_list,instagram_basic,instagram_manage_insights,pages_read_engagement&response_type=code`;
    
    console.log('Generated Facebook auth URL:', authUrl);
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Auth URL error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate auth URL' }, 
      { status: 500 }
    );
  }
}

