// Written by Paing, edited by Aria
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  console.log('[Gmail OAuth] Incoming callback request:', { url: req.url });
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    console.log('[Gmail OAuth] Extracted query params:', { codePresent: !!code, statePresent: !!state });

    if (!code || !state) {
      console.error('[Gmail OAuth] Missing code or state in query params.', { code, state });
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=missing_params&tab=integrations`);
    }

    // Decode state parameter to log userId for debugging
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      console.log('[Gmail OAuth] Decoded state parameter:', { userId: stateData.userId });
    } catch (decodeErr) {
      console.error('[Gmail OAuth] Failed to decode state parameter.', { state, error: decodeErr });
      // Continue with the flow even if we can't decode the state for logging
    }

    // Redirect to backend with original OAuth parameters
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/gmail/oauth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    console.log('[Gmail OAuth] Redirecting to backend:', { backendUrl });
    
    return NextResponse.redirect(backendUrl);
  } catch (err) {
    console.error('[Gmail OAuth] Error handling callback.', { error: err });
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_callback_failed&tab=integrations`);
  }
}