export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { google } from 'googleapis'
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/gmail`
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

    // Store Gmail data in Convex
    await convex.mutation(api.gmail.storeGmailData, {
      userId,
      profileData: {
        emailAddress: profile.data.emailAddress,
        messagesTotal: profile.data.messagesTotal,
        threadsTotal: profile.data.threadsTotal,
        historyId: profile.data.historyId,
      },
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
      tokenType: tokens.token_type!,
      scope: tokens.scope!,
    });

    // Update connection status
    await convex.mutation(api.social.updateConnectionStatus, {
      userId,
      platform: 'gmail',
      isConnected: true,
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=gmail_connected`)

  } catch (error) {
    console.error('[GMAIL_CALLBACK_ERROR]', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=unknown`)
  }
} 