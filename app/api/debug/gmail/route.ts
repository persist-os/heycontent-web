import { NextResponse } from 'next/server';
import { getServerSession } from '@/app/lib/server-auth';
import { google } from 'googleapis';
import { validateToken } from '@/app/lib/auth-helpers';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { adminAuth } from '@/app/lib/firebase-admin';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  try {
    console.log('Gmail debug endpoint called');
    
    // Get the token from the request
    const { token } = await request.json();
    const authHeader = request.headers.get('Authorization');
    
    if (!token && (!authHeader || !authHeader.startsWith('Bearer '))) {
      console.log('No token provided');
      return NextResponse.json({
        error: 'No token provided',
        authHeader: authHeader ? 'Present' : 'Missing'
      }, { status: 400 });
    }

    // Use the token from the Authorization header if available
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : token;

    // Verify the token with Firebase Admin
    console.log('Verifying token with Firebase Admin...');
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(bearerToken);
      console.log('Token verified successfully for user:', decodedToken.uid);
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return NextResponse.json({ 
        error: 'Invalid token',
        details: verifyError instanceof Error ? verifyError.message : 'Unknown error'
      }, { status: 401 });
    }

    // Get user's Gmail token from Convex
    console.log('Getting Gmail token from Convex...');
    const gmailToken = await convex.query(api.tokens.get, {
      userId: decodedToken.uid,
      platform: 'gmail'
    });

    if (!gmailToken) {
      return NextResponse.json({
        success: false,
        error: 'Gmail not connected',
        message: 'No Gmail token found for this user'
      });
    }

    // Validate token and test Gmail API access
    console.log('Validating Gmail token...');
    try {
      const accessToken = await validateToken(decodedToken.uid, 'gmail');
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
        message: 'Gmail connection successful',
        tokenStatus: 'valid',
        tokenExpiry: new Date(gmailToken.expiresAt * 1000).toISOString(),
        email: profile.data.emailAddress,
        messagesTotal: profile.data.messagesTotal,
        threadsTotal: profile.data.threadsTotal,
        grantedScopes: tokenInfo.scopes
      });
    } catch (error: any) {
      console.error('Gmail API Error:', error);
      return NextResponse.json({
        success: false,
        error: 'Gmail API error',
        message: error.message,
        details: error.response?.data || 'Failed to test Gmail connection',
        tokenExpiry: gmailToken ? new Date(gmailToken.expiresAt * 1000).toISOString() : null
      });
    }
  } catch (error) {
    console.error('Gmail debug error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
