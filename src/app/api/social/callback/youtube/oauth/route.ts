// Written by Aria

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  console.log('[YouTube OAuth] Incoming callback request:', { url: req.url });
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    console.log('[YouTube OAuth] Extracted query params:', { codePresent: !!code, statePresent: !!state });

    if (!code || !state) {
      console.error('[YouTube OAuth] Missing code or state in query params.', { code, state });
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=missing_params&tab=integrations`);
    }

    // Decode state parameter
    let userId: string | undefined = undefined;
    try {
      userId = JSON.parse(Buffer.from(state, 'base64').toString()).userId;
      console.log('[YouTube OAuth] Decoded state parameter:', { userId });
    } catch (decodeErr) {
      console.error('[YouTube OAuth] Failed to decode state parameter.', { state, error: decodeErr });
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_state&tab=integrations`);
    }

    // Verify that we have a userId in the state
    if (!userId) {
      console.error('[YouTube OAuth] No userId found in state parameter.', { state });
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_state&tab=integrations`);
    }

    // Proxy OAuth callback to FastAPI backend
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/youtube/oauth/callback`;
    console.log('[YouTube OAuth] Forwarding callback to backend:', { backendUrl, userId });
    try {
      const backendRes = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, userId }),
      });
      if (backendRes.ok) {
        console.log('[YouTube OAuth] Successfully connected YouTube for user.', { userId });
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=youtube_connected&tab=integrations`);
      } else {
        const errorData = await backendRes.json().catch(() => ({}));
        console.error('[YouTube OAuth] Backend responded with error.', { status: backendRes.status, error: errorData?.error });
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_backend_failed&details=${encodeURIComponent(errorData?.error || 'unknown')}&tab=integrations`);
      }
    } catch (err) {
      console.error('[YouTube OAuth] Error communicating with FastAPI backend.', { error: err, backendUrl, userId });
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_backend_failed&tab=integrations`);
    }
  } catch (err) {
    console.error('[YouTube OAuth] Error handling callback.', { error: err });
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_callback_failed&tab=integrations`);
  }
}