import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Configure the access scopes required for your application.
// For reading emails, you need at least 'https://www.googleapis.com/auth/gmail.readonly'
const scopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
];

export async function GET() {
  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request a refresh token
    scope: scopes,
    prompt: 'consent', // Always ask for consent to ensure refresh token is returned
  });

  return NextResponse.redirect(authorizationUrl);
} 