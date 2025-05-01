import { NextResponse } from 'next/server'
import { getServerSession } from '@/app/lib/server-auth'
import { google } from 'googleapis'
import { GMAIL_CONFIG } from '@/app/lib/config/gmail'
import { validateToken } from '@/app/lib/auth-helpers'
import { fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Gmail token from Convex
    const token = await fetchQuery(api.tokens.get, {
      userId: session.user.id,
      platform: 'gmail'
    });

    if (!token) {
      return NextResponse.json({
        isConnected: false,
        error: GMAIL_CONFIG.ERROR_MESSAGES.NOT_CONNECTED
      });
    }

    // Validate token and test Gmail API access
    const accessToken = await validateToken(session.user.id, 'gmail');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    oauth2Client.setCredentials({ access_token: accessToken });

    // Get token info to check scopes
    const tokenInfo = await oauth2Client.getTokenInfo(accessToken);
    const hasRequiredScopes = GMAIL_CONFIG.REQUIRED_SCOPES.every(scope =>
      tokenInfo.scopes?.includes(scope)
    );

    if (!hasRequiredScopes) {
      return NextResponse.json({
        isConnected: false,
        error: GMAIL_CONFIG.ERROR_MESSAGES.MISSING_REQUIRED_SCOPES,
        requiredScopes: GMAIL_CONFIG.REQUIRED_SCOPES,
        grantedScopes: tokenInfo.scopes
      });
    }

    // Try a minimal Gmail API request
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({
      userId: 'me'
    });

    return NextResponse.json({
      isConnected: true,
      profile: profile.data
    });
  } catch (error) {
    console.error('Gmail status error:', error);
    return NextResponse.json(
      { error: 'Failed to check Gmail status' },
      { status: 500 }
    );
  }
}