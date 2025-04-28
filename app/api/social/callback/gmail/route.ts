export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
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

    // Verify that we have a userId in the state
    if (!userId) {
      console.error('No userId in state parameter');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_state`);
    }

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
    console.log('Storing Gmail data in Convex...');
    const storeResult = await convex.mutation(api.gmail.storeGmailData, {
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
    console.log('Gmail data stored successfully, ID:', storeResult);

    // Store token in Convex tokens table
    console.log('Storing Gmail token in Convex...');
    await convex.mutation(api.tokens.save, {
      userId,
      platform: 'gmail',
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : Date.now() + 3600 * 1000, // Default 1 hour if no expiry
      scope: typeof tokens.scope === 'string' ? tokens.scope.split(' ') : [],
      tokenType: tokens.token_type!
    });
    console.log('Gmail token stored successfully');

    // Check if social account is properly stored
    console.log('Checking for Gmail social account in Convex...');
    let socialAccount;
    try {
      const connectedAccounts = await convex.query(api.social.getConnectedAccounts, {
        userId: userId
      });
      console.log('Connected accounts query result:', connectedAccounts ? `Found ${connectedAccounts.length} accounts` : 'No accounts found');

      socialAccount = connectedAccounts?.find(account => account.platform === 'gmail');
      console.log('Gmail social account in Convex:', socialAccount ? 'Account found' : 'No account found');
    } catch (accountError) {
      console.error('Error fetching social accounts:', accountError);
      socialAccount = null;
    }

    // Ensure social account is properly stored
    if (!socialAccount) {
      console.log('Creating Gmail social account in Convex...');
      try {
        await convex.mutation(api.social.saveAccount, {
          userId,
          platform: 'gmail',
          username: profile.data.emailAddress || '',
          metadata: {
            emailAddress: profile.data.emailAddress,
            messagesTotal: profile.data.messagesTotal,
            threadsTotal: profile.data.threadsTotal,
            historyId: profile.data.historyId,
          },
          isConnected: true,
          updatedAt: Date.now()
        });
        console.log('Gmail social account created successfully');
      } catch (saveError) {
        console.error('Error creating Gmail social account:', saveError);
      }
    }

    // Update connection status
    console.log('Updating Gmail connection status in Convex...');
    await convex.mutation(api.social.updateConnectionStatus, {
      userId,
      platform: 'gmail',
      isConnected: true,
    });
    console.log('Connection status updated successfully');

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=gmail_connected`)

  } catch (error) {
    console.error('[GMAIL_CALLBACK_ERROR]', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=unknown`)
  }
}