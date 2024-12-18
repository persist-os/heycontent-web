export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'

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

    // Save or update social account in database
    await prisma.socialAccount.upsert({
      where: {
        userId_platform: {
          userId,
          platform: 'gmail'
        }
      },
      create: {
        platform: 'gmail',
        username: profile.data.emailAddress,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        tokenType: tokens.token_type,
        scope: tokens.scope,
        metadata: {
          emailAddress: profile.data.emailAddress,
          messagesTotal: profile.data.messagesTotal,
          threadsTotal: profile.data.threadsTotal,
          historyId: profile.data.historyId
        },
        isConnected: true,
        userId
      },
      update: {
        username: profile.data.emailAddress,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        tokenType: tokens.token_type,
        scope: tokens.scope,
        metadata: {
          emailAddress: profile.data.emailAddress,
          messagesTotal: profile.data.messagesTotal,
          threadsTotal: profile.data.threadsTotal,
          historyId: profile.data.historyId
        },
        isConnected: true
      }
    })

    // Redirect back to settings page with success message
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=gmail_connected`)

  } catch (error) {
    console.error('[GMAIL_CALLBACK_ERROR]', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=gmail_connection_failed`)
  }
} 