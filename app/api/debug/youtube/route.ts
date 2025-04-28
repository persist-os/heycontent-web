import { NextResponse } from 'next/server';
import { getServerSession } from '@/app/lib/server-auth';
import { google } from 'googleapis';
import { validateToken } from '@/app/lib/auth-helpers';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { adminAuth } from '@/app/lib/firebase-admin';
import { jwtDecode } from 'jwt-decode';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface YouTubeMetadata {
  channelId: string;
  subscribers?: string;
  videos?: string;
  views?: string;
}

function isYouTubeMetadata(metadata: any): metadata is YouTubeMetadata {
  return metadata && typeof metadata === 'object' && typeof metadata.channelId === 'string';
}

export async function POST(request: Request) {
  try {
    console.log('YouTube debug endpoint called');

    // First try to get the session using the fixed session mechanism
    console.log('Getting server session...');
    const session = await getServerSession();
    console.log('Session result:', session ? 'Session found' : 'No session found');

    if (session?.user?.id) {
      console.log('Using authenticated session for user:', session.user.id);
      return await handleYouTubeDebug(session.user.id);
    }

    // Fallback to token-based authentication if session is not available
    console.log('No session found, falling back to token-based authentication');
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.log('No request body or invalid JSON');
      requestBody = {};
    }

    const { token } = requestBody;
    const authHeader = request.headers.get('Authorization');

    if (!token && (!authHeader || !authHeader.startsWith('Bearer '))) {
      console.log('No token provided');
      return NextResponse.json({
        error: 'No token provided',
        authHeader: authHeader ? 'Present' : 'Missing',
        message: 'Please log in again to continue.',
        code: 'TOKEN_MISSING'
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
      // Check if token is a string
      if (typeof bearerToken !== 'string') {
        console.error('Token is not a string:', typeof bearerToken);
        return NextResponse.json({
          error: 'Invalid token format',
          message: 'Authentication token must be a string',
          code: 'TOKEN_FORMAT_ERROR'
        }, { status: 400 });
      }

      // Log token format for debugging (first few chars only)
      const tokenPreview = bearerToken.substring(0, 20) + '...';
      console.log('Token format (preview):', tokenPreview);

      decodedToken = await adminAuth.verifyIdToken(bearerToken);
      console.log('Token verified successfully for user:', decodedToken.uid);
      return await handleYouTubeDebug(decodedToken.uid);
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);

      // Try to decode the token manually to see if it's a valid JWT
      try {
        if (typeof bearerToken === 'string') {
          const manualDecoded = jwtDecode(bearerToken) as { uid?: string; user_id?: string; sub?: string; email?: string };
          console.log('Manual token decode succeeded:', {
            uid: manualDecoded.uid || manualDecoded.user_id || manualDecoded.sub,
            email: manualDecoded.email
          });

          // If we can decode it but Firebase can't verify it, it might be expired
          return NextResponse.json({
            error: 'Token expired or invalid',
            message: 'Your session has expired. Please log in again.',
            code: 'TOKEN_EXPIRED'
          }, { status: 401 });
        } else {
          console.error('Cannot manually decode token: not a string');
          return NextResponse.json({
            error: 'Invalid token format',
            message: 'Authentication token must be a string',
            code: 'TOKEN_FORMAT_ERROR'
          }, { status: 400 });
        }
      } catch (decodeError) {
        console.error('Manual token decode also failed:', decodeError);
      }

      return NextResponse.json({
        error: 'Invalid token',
        details: verifyError instanceof Error ? verifyError.message : 'Unknown error',
        message: 'Authentication failed. Please log in again.',
        code: 'TOKEN_INVALID'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('YouTube debug error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleYouTubeDebug(userId: string) {
  try {

    // Get user's YouTube token from Convex
    console.log('Getting YouTube token from Convex...');
    const youtubeToken = await convex.query(api.tokens.get, {
      userId: userId,
      platform: 'youtube'
    });
    console.log('Token result:', youtubeToken ? 'Token found' : 'No token found');

    if (!youtubeToken) {
      console.log('No YouTube token found for user');
      return NextResponse.json({
        success: false,
        error: 'YouTube not connected',
        message: 'No YouTube token found for this user'
      });
    }
    console.log('YouTube token found, expires at:', new Date(youtubeToken.expiresAt * 1000).toISOString());

    // Validate token and test YouTube API access
    console.log('Validating YouTube token...');
    try {
      const accessToken = await validateToken(userId, 'youtube');
      console.log('Token validated successfully');

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.YOUTUBE_REDIRECT_URI
      );

      oauth2Client.setCredentials({ access_token: accessToken });

      // Get token info to check scopes
      console.log('Getting token info to check scopes...');
      const tokenInfo = await oauth2Client.getTokenInfo(accessToken);
      console.log('Token scopes:', tokenInfo.scopes);

      // Try a minimal YouTube API request
      console.log('Making YouTube API request...');
      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

      // Get channel information
      const channelResponse = await youtube.channels.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        mine: true
      });

      const channel = channelResponse.data.items?.[0];

      if (!channel) {
        console.log('No YouTube channel found');
        return NextResponse.json({
          success: false,
          error: 'No YouTube channel found',
          message: 'Could not retrieve YouTube channel information'
        });
      }
      console.log('YouTube channel found:', channel.id, channel.snippet?.title);

      // Check if data is properly stored in Convex
      console.log('Checking YouTube data in Convex...');
      const youtubeData = await convex.query(api.youtube.getYouTubeData, {
        userId: userId
      });
      console.log('YouTube data in Convex:', youtubeData ? 'Data found' : 'No data found');

      // Check if social account is properly stored
      console.log('Checking for YouTube social account in Convex...');
      let socialAccount;
      try {
        const connectedAccounts = await convex.query(api.social.getConnectedAccounts, {
          userId: userId
        });
        console.log('Connected accounts query result:', connectedAccounts ? `Found ${connectedAccounts.length} accounts` : 'No accounts found');

        socialAccount = connectedAccounts?.find(account => account.platform === 'youtube');
        console.log('YouTube social account in Convex:', socialAccount ? 'Account found' : 'No account found');
      } catch (accountError) {
        console.error('Error fetching social accounts:', accountError);
        socialAccount = null;
      }

      // Update YouTube data in Convex if needed
      if (!youtubeData || !socialAccount) {
        console.log('Updating YouTube data in Convex...');
        try {
          // Store detailed data about the channel
          const storeResult = await convex.mutation(api.youtube.storeYouTubeData, {
            userId: userId,
            channelData: {
              id: channel.id,
              snippet: channel.snippet,
              statistics: channel.statistics,
              profileUrl: `https://youtube.com/channel/${channel.id}`,
              avatarUrl: channel.snippet?.thumbnails?.default?.url,
            },
            accessToken: accessToken,
            refreshToken: youtubeToken.refreshToken || undefined,
            expiresAt: youtubeToken.expiresAt,
            tokenType: 'Bearer',
            scope: youtubeToken.scope || '',
          });
          console.log('YouTube data updated successfully, ID:', storeResult);

          // Also ensure connection status is updated
          await convex.mutation(api.social.updateConnectionStatus, {
            userId: userId,
            platform: 'youtube',
            isConnected: true
          });
          console.log('Connection status updated successfully');
        } catch (storeError) {
          console.error('Error storing YouTube data:', storeError);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'YouTube connection successful',
        tokenStatus: 'valid',
        tokenExpiry: new Date(youtubeToken.expiresAt * 1000).toISOString(),
        channel: {
          id: channel.id,
          title: channel.snippet?.title,
          description: channel.snippet?.description,
          customUrl: channel.snippet?.customUrl,
          publishedAt: channel.snippet?.publishedAt,
          thumbnails: channel.snippet?.thumbnails,
          statistics: channel.statistics
        },
        grantedScopes: tokenInfo.scopes,
        dataStored: {
          youtubeData: !!youtubeData,
          socialAccount: !!socialAccount
        }
      });
    } catch (error: any) {
      console.error('YouTube API Error:', error);
      const errorMessage = error.message || 'Unknown error';
      const errorDetails = error.response?.data || 'Failed to test YouTube connection';
      console.error('Error details:', errorDetails);

      return NextResponse.json({
        success: false,
        error: 'YouTube API error',
        message: errorMessage,
        details: errorDetails,
        tokenExpiry: youtubeToken ? new Date(youtubeToken.expiresAt * 1000).toISOString() : null
      });
    }
  } catch (error) {
    console.error('YouTube debug handler error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
