import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import prisma from '@/app/lib/prisma'
import { google } from 'googleapis'
import { GMAIL_CONFIG } from '@/app/lib/config/gmail'
import { validateToken } from '@/app/lib/auth-helpers'

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Gmail account
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        socialAccounts: {
          where: { 
            platform: 'gmail',
            isConnected: true
          }
        }
      }
    });

    const gmailAccount = user?.socialAccounts[0];
    if (!gmailAccount) {
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
      email: profile.data.emailAddress,
      messagesTotal: profile.data.messagesTotal,
      threadsTotal: profile.data.threadsTotal,
      grantedScopes: tokenInfo.scopes,
      lastSynced: gmailAccount.updatedAt
    });

  } catch (error) {
    console.error('Error checking Gmail status:', error);
    return NextResponse.json({ 
      isConnected: false,
      error: error instanceof Error ? error.message : 'Failed to check Gmail status'
    });
  }
} 