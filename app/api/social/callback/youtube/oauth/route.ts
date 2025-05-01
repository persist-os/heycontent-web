export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=missing_params`);
    }

    // Decode state parameter
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Verify that we have a userId in the state
    if (!userId) {
      console.error('No userId in state parameter');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_state`);
    }

    // Proxy OAuth callback to FastAPI backend
    try {
      const backendRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/youtube/oauth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, userId }),
      });
      if (backendRes.ok) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=youtube_connected`);
      } else {
        const errorData = await backendRes.json().catch(() => ({}));
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_backend_failed&details=${encodeURIComponent(errorData?.error || 'unknown')}`);
      }
    } catch (err) {
      console.error('Error communicating with FastAPI backend:', err);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_backend_failed`);
    }
  } catch (err) {
    console.error('Error handling YouTube OAuth callback:', err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_callback_failed`);
  }
}