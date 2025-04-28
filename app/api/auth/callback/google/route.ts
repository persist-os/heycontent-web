import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { storeGmailCredentials } from '@/src/lib/gmail/auth';
import { auth } from '@/app/auth';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Authorization code not found' }, { status: 400 });
  }

  try {
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Authenticate the user (ensure session exists)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Store tokens securely in Convex
    await storeGmailCredentials({
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      scope: tokens.scope!,
      expiry_date: tokens.expiry_date!,
    });

    // Do NOT return tokens to the client
    return NextResponse.json({ message: 'Successfully authenticated with Google!' });
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return NextResponse.json({ 
      error: 'Failed to authenticate with Google',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 