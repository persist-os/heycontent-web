// Written by Paing
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=missing_params`)
    }

    // Decode state parameter
    const { userId, platform } = JSON.parse(Buffer.from(state, 'base64').toString())

    // Verify that we have a userId in the state
    if (!userId) {
      console.error('No userId in state parameter');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_state`);
    }

    // Create OAuth2 client
    // Partially written by Paing
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    )

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Get token info to verify scopes
    const tokenInfo = await oauth2Client.getTokenInfo(tokens.access_token!)
    console.log('Token Info:', {
      scopes: tokenInfo.scopes,
      email: tokenInfo.email,
      expiryDate: tokenInfo.expiry_date
    })

    // Verify we have the required Gmail scopes
    const requiredScopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://mail.google.com/'
    ];

    const hasRequiredScopes = requiredScopes.every(scope =>
      tokenInfo.scopes?.includes(scope)
    );

    if (!hasRequiredScopes) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=insufficient_scopes`)
    }

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // Get profile information
    const profile = await gmail.users.getProfile({ userId: 'me' })

    // Store Gmail data and tokens in Convex (YouTube-style)
    console.log('Storing Gmail data and tokens in Convex...');
    const storeResult = await fetchMutation(api.gmailMutations.update_gmail_token, {
      userId,
      email: profile.data.emailAddress ?? '',
      messagesTotal: profile.data.messagesTotal ?? undefined,
      threadsTotal: profile.data.threadsTotal ?? undefined,
      historyId: profile.data.historyId ?? undefined,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? undefined,
      expiresAt: tokens.expiry_date != null ? Math.floor(tokens.expiry_date) / 1000 : undefined,
      tokenType: tokens.token_type ?? '',
      scope: typeof tokens.scope === 'string' ? tokens.scope.split(' ') : Array.isArray(tokens.scope) ? tokens.scope : [],
    });
    console.log('Gmail data and tokens stored successfully:', storeResult);

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=gmail_connected`)

  } catch (error) {
    console.error('[GMAIL_CALLBACK_ERROR]', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=unknown`)
  }
}