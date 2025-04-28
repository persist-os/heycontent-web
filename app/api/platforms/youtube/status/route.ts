import { NextResponse } from 'next/server'
import { getServerSession } from '@/app/lib/server-auth'
import { google } from 'googleapis'
import { YOUTUBE_CONFIG } from '@/app/lib/config/youtube'
import { validateToken } from '@/app/lib/auth-helpers'
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function GET() {
  console.log('YouTube status route called');
  try {
    console.log('Getting server session...');
    const session = await getServerSession();
    console.log('Session result:', session ? 'Session found' : 'No session found');

    if (!session?.user?.id) {
      console.log('No user ID in session, returning 401');
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'No valid session found. Please log in again.',
        code: 'SESSION_MISSING'
      }, { status: 401 });
    }

    console.log('User authenticated:', session.user.id);

    // Get user's YouTube token from Convex
    console.log('Querying Convex for YouTube token...');
    const token = await convex.query(api.tokens.get, {
      userId: session.user.id,
      platform: 'youtube'
    });
    console.log('Token result:', token ? 'Token found' : 'No token found');

    if (!token) {
      console.log('No YouTube token found for user');
      return NextResponse.json({
        isConnected: false,
        error: YOUTUBE_CONFIG.ERROR_MESSAGES.NO_ACCESS_TOKEN
      });
    }
    console.log('YouTube token found, expires at:', new Date(token.expiresAt * 1000).toISOString());

    // Validate token and test YouTube API access
    console.log('Validating YouTube token...');
    const accessToken = await validateToken(session.user.id, 'youtube');
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

    const hasRequiredScopes = YOUTUBE_CONFIG.REQUIRED_SCOPES.every(scope =>
      tokenInfo.scopes?.includes(scope)
    );
    console.log('Has required scopes:', hasRequiredScopes);

    if (!hasRequiredScopes) {
      console.log('Missing required scopes');
      return NextResponse.json({
        isConnected: false,
        error: YOUTUBE_CONFIG.ERROR_MESSAGES.MISSING_REQUIRED_SCOPES,
        requiredScopes: YOUTUBE_CONFIG.REQUIRED_SCOPES,
        grantedScopes: tokenInfo.scopes
      });
    }

    // Try a minimal YouTube API request
    console.log('Making YouTube API request...');
    const youtube = google.youtube('v3');
    const response = await youtube.channels.list({
      auth: oauth2Client,
      part: ['snippet', 'statistics'],
      mine: true
    });

    const channel = response.data.items?.[0];
    if (!channel) {
      console.log('No YouTube channel found');
      return NextResponse.json({
        isConnected: false,
        error: 'No YouTube channel found'
      });
    }
    console.log('YouTube channel found:', channel.id, channel.snippet?.title);

    // Check if data is properly stored in Convex
    console.log('Checking YouTube data in Convex...');
    const youtubeData = await convex.query(api.youtube.getYouTubeData, {
      userId: session.user.id
    });
    console.log('YouTube data in Convex:', youtubeData ? 'Data found' : 'No data found');

    // Check if social account is properly stored
    console.log('Checking for YouTube social account in Convex...');
    let socialAccount;
    try {
      const connectedAccounts = await convex.query(api.social.getConnectedAccounts, {
        userId: session.user.id
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
          userId: session.user.id,
          channelData: {
            id: channel.id,
            snippet: channel.snippet,
            statistics: channel.statistics,
            profileUrl: `https://youtube.com/channel/${channel.id}`,
            avatarUrl: channel.snippet?.thumbnails?.default?.url,
          },
          accessToken: accessToken,
          refreshToken: token.refreshToken || undefined,
          expiresAt: token.expiresAt,
          tokenType: 'Bearer',
          scope: token.scope || '',
        });
        console.log('YouTube data updated successfully, ID:', storeResult);

        // Also ensure connection status is updated
        await convex.mutation(api.social.updateConnectionStatus, {
          userId: session.user.id,
          platform: 'youtube',
          isConnected: true
        });
        console.log('Connection status updated successfully');
      } catch (storeError) {
        console.error('Error storing YouTube data:', storeError);
      }
    }

    return NextResponse.json({
      isConnected: true,
      channel: {
        id: channel.id,
        title: channel.snippet?.title,
        description: channel.snippet?.description,
        statistics: channel.statistics
      },
      dataStored: {
        youtubeData: !!youtubeData,
        socialAccount: !!socialAccount
      }
    });
  } catch (error) {
    console.error('YouTube status error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error && 'response' in error ? (error as any).response?.data : undefined;

    return NextResponse.json(
      {
        error: 'Failed to check YouTube status',
        message: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}
