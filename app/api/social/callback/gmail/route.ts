export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import prisma from '@/app/lib/prisma'
import { google } from 'googleapis'
import { GMAIL_CONFIG } from '@/app/lib/config/gmail'

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=unauthorized`);
    }

    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=missing_params`)
    }

    // Decode state parameter
    const { userId, platform } = JSON.parse(Buffer.from(state, 'base64').toString())
    
    // Verify the user ID matches the session
    if (userId !== session.user.id) {
      console.error('User ID mismatch:', { stateUserId: userId, sessionUserId: session.user.id });
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=user_mismatch`);
    }

    // Create OAuth2 client with required scopes
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/gmail`
    )

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Verify token has required scopes
    const tokenInfo = await oauth2Client.getTokenInfo(tokens.access_token!)
    const hasRequiredScopes = GMAIL_CONFIG.REQUIRED_SCOPES.every(scope => 
      tokenInfo.scopes?.includes(scope)
    )

    if (!hasRequiredScopes) {
      console.error('Missing required Gmail scopes:', {
        required: GMAIL_CONFIG.REQUIRED_SCOPES,
        granted: tokenInfo.scopes
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=missing_scopes&message=${encodeURIComponent(GMAIL_CONFIG.ERROR_MESSAGES.MISSING_REQUIRED_SCOPES)}`
      )
    }

    // Initialize Gmail API
    const gmail = google.gmail('v1')
    
    // Get user profile
    const profile = await gmail.users.getProfile({
      auth: oauth2Client,
      userId: 'me'
    })

    if (!profile.data.emailAddress) {
      throw new Error('No Gmail profile found')
    }

    // Save credentials in both Account and SocialAccount tables
    await Promise.all([
      // Update Account table
      prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: profile.data.emailAddress
          }
        },
        create: {
          userId,
          type: 'oauth',
          provider: 'google',
          providerAccountId: profile.data.emailAddress,
          access_token: tokens.access_token!,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
          token_type: tokens.token_type,
          scope: tokens.scope
        },
        update: {
          access_token: tokens.access_token!,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
          token_type: tokens.token_type,
          scope: tokens.scope
        }
      }),
      // Update SocialAccount table
      prisma.socialAccount.upsert({
        where: {
          userId_platform: {
            userId,
            platform: 'gmail'
          }
        },
        create: {
          userId,
          platform: 'gmail',
          username: profile.data.emailAddress,
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          tokenType: tokens.token_type,
          scope: tokens.scope,
          isConnected: true,
          metadata: {
            messagesTotal: profile.data.messagesTotal,
            threadsTotal: profile.data.threadsTotal,
            historyId: profile.data.historyId,
            grantedScopes: tokenInfo.scopes
          }
        },
        update: {
          username: profile.data.emailAddress,
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          tokenType: tokens.token_type,
          scope: tokens.scope,
          isConnected: true,
          metadata: {
            messagesTotal: profile.data.messagesTotal,
            threadsTotal: profile.data.threadsTotal,
            historyId: profile.data.historyId,
            grantedScopes: tokenInfo.scopes
          }
        }
      })
    ])

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`)
  } catch (error) {
    console.error('Error in Gmail callback:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=callback_failed&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    )
  }
} 