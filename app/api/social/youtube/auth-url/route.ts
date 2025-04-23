import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.YOUTUBE_REDIRECT_URI) {
      throw new Error('Missing Google OAuth configuration');
    }

    const state = Buffer.from(JSON.stringify({
      userId: session.user.id,
      platform: 'youtube'
    })).toString('base64');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${process.env.YOUTUBE_REDIRECT_URI}&` +
      `scope=${encodeURIComponent([
        'https://www.googleapis.com/auth/youtube.force-ssl',
        'https://www.googleapis.com/auth/yt-analytics.readonly'
      ].join(' '))}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('YouTube auth URL error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
} 