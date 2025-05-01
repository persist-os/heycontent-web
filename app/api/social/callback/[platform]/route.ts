import { NextResponse } from 'next/server'
import { SocialPlatform } from '@/app/types/social-platforms'
import { google } from 'googleapis'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import { adminAuth } from '@/app/lib/firebase-admin'

const PLATFORM_CONFIGS: Record<SocialPlatform, {
  tokenUrl: string;
  clientId: string | undefined;
  clientSecret: string | undefined;
}> = {
  instagram: {
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    clientId: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
  },
  tiktok: {
    tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
    clientId: process.env.TIKTOK_CLIENT_ID,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
  },
  youtube: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  gmail: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }
}

const API_ENDPOINTS: Record<SocialPlatform, string> = {
  instagram: 'https://graph.instagram.com/me?fields=id,username,account_type',
  tiktok: 'https://open-api.tiktok.com/user/info/',
  youtube: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
  gmail: 'https://gmail.googleapis.com/gmail/v1/users/me/profile'
}

async function exchangeCodeForToken(platform: SocialPlatform, code: string, redirectUri: string) {
  if (platform === 'gmail' || platform === 'youtube') {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    )
    const { tokens } = await oauth2Client.getToken(code)
    return tokens
  }

  const platformConfig = PLATFORM_CONFIGS[platform]

  const response = await fetch(platformConfig.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: platformConfig.clientId!,
      client_secret: platformConfig.clientSecret!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })
  })

  return response.json()
}

async function fetchUserProfile(platform: SocialPlatform, accessToken: string) {
  if (platform === 'gmail') {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })
    const gmail = google.gmail('v1')
    const profile = await gmail.users.getProfile({
      auth: oauth2Client,
      userId: 'me'
    })
    console.log('Gmail profile data:', profile.data)
    return profile.data
  }

  if (platform === 'youtube') {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })
    const youtube = google.youtube('v3')
    const response = await youtube.channels.list({
      auth: oauth2Client,
      part: ['snippet,statistics'],
      mine: true
    })

    const channelData = response.data.items?.[0]
    console.log('YouTube channel data:', JSON.stringify(channelData, null, 2))

    if (!channelData) {
      throw new Error('No YouTube channel data found')
    }

    return channelData
  }

  const response = await fetch(API_ENDPOINTS[platform], {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  return response.json()
}

export async function GET(
  request: Request,
  { params }: { params: { platform: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=missing_params`)
    }

    // Decode state parameter
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { userId, platform } = stateData;

    console.log('Callback received for platform:', platform, 'with userId:', userId);

    // Exchange code for access token
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/${platform}`
    const tokenData = await exchangeCodeForToken(platform as SocialPlatform, code, redirectUri)

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=token_exchange`)
    }

    // Fetch user profile from the platform
    const profile = await fetchUserProfile(platform as SocialPlatform, tokenData.access_token)

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Verify the user exists in Convex
    const user = await convex.query(api.users.getUserById, { userId });
    if (!user) {
      console.error('User not found in Convex:', userId);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=user_not_found`);
    }

    // Prepare metadata based on platform
    const metadata = platform === 'gmail' ? {
      emailAddress: profile.emailAddress,
      messagesTotal: profile.messagesTotal,
      threadsTotal: profile.threadsTotal,
      historyId: profile.historyId
    } : platform === 'youtube' ? {
      channelId: profile.id,
      subscribers: profile.statistics?.subscriberCount,
      videos: profile.statistics?.videoCount,
      views: profile.statistics?.viewCount
    } : profile;

    // Save token in Convex
    await convex.mutation(api.tokens.save, {
      userId,
      platform,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || undefined,
      expiresAt: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : Date.now() + 3600 * 1000,
      tokenType: tokenData.token_type || 'Bearer',
      scope: tokenData.scope ? tokenData.scope.split(' ') : []
    });

    // Save social account in Convex (skip for YouTube as it's handled by storeYouTubeData)
    if (platform !== 'youtube') {
      await convex.mutation(api.social.saveAccount, {
        userId,
        platform,
        username: platform === 'gmail' ? profile.emailAddress : profile.username || profile.name || 'unknown',
        metadata,
        isConnected: true,
        updatedAt: Date.now()
      });
    }

    // If it's YouTube, save additional data
    if (platform === 'youtube' && profile) {
      console.log('Saving YouTube channel data:', {
        channelId: profile.id,
        title: profile.snippet?.title,
        statistics: profile.statistics
      });

      // Use the improved storeYouTubeData mutation that updates both youtubeData and socialAccounts
      await convex.mutation(api.youtubeMutations.storeYouTubeData, {
        userId,
        channelData: {
          id: profile.id,
          snippet: profile.snippet,
          statistics: profile.statistics,
          profileUrl: `https://youtube.com/channel/${profile.id}`,
          avatarUrl: profile.snippet?.thumbnails?.default?.url,
        },
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || undefined,
        expiresAt: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : Date.now() + 3600 * 1000,
        tokenType: 'Bearer',
        scope: tokenData.scope || '',
      });
    }

    // If it's Gmail, save additional data
    if (platform === 'gmail' && profile) {
      console.log('Saving Gmail profile data:', {
        emailAddress: profile.emailAddress,
        messagesTotal: profile.messagesTotal,
        threadsTotal: profile.threadsTotal
      });

      // Convert string counts to numbers if needed
      const messagesTotal = typeof profile.messagesTotal === 'string'
        ? parseInt(profile.messagesTotal, 10)
        : (profile.messagesTotal || 0);

      const threadsTotal = typeof profile.threadsTotal === 'string'
        ? parseInt(profile.threadsTotal, 10)
        : (profile.threadsTotal || 0);

      await convex.mutation(api.gmail.saveProfileData, {
        userId,
        emailAddress: profile.emailAddress,
        messagesTotal,
        threadsTotal,
        historyId: profile.historyId || '',
        updatedAt: Date.now()
      });
    }

    // Redirect back to settings page with success message
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=connected`)

  } catch (error) {
    console.error('[SOCIAL_CALLBACK_ERROR]', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=unknown`)
  }
}