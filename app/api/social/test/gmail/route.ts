import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { google } from 'googleapis';
import { validateToken } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function POST() {
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
      return NextResponse.json({ error: 'Gmail account not connected' }, { status: 400 });
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
    
    // Try a minimal Gmail API request
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({
      userId: 'me'
    });

    return NextResponse.json({
      success: true,
      tokenStatus: 'valid',
      email: profile.data.emailAddress,
      messagesTotal: profile.data.messagesTotal,
      threadsTotal: profile.data.threadsTotal,
      grantedScopes: tokenInfo.scopes
    });
  } catch (error: any) {
    console.error('Gmail API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.response?.data || 'Failed to test Gmail connection'
    }, { status: 500 });
  }
} 