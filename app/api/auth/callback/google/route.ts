import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

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
    
    // TODO: Store these tokens securely in your database
    // You'll want to store:
    // - tokens.access_token
    // - tokens.refresh_token
    // - tokens.expiry_date
    // - tokens.scope
    
    // For now, we'll just return a success message
    return NextResponse.json({ 
      message: 'Successfully authenticated with Google!',
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        scope: tokens.scope
      }
    });

  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return NextResponse.json({ 
      error: 'Failed to authenticate with Google',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 