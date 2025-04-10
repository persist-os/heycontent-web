import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL');
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get connected platforms from Convex
    const [connectedAccounts, connectionStatus] = await Promise.all([
      convex.query(api.social.getConnectedAccounts, { userId: session.user.id }),
      convex.query(api.social.getConnectionStatus, { userId: session.user.id })
    ]);

    const accounts = [...connectedAccounts];
    
    // Get YouTube data if connected
    let youtubeData = null;
    if (connectionStatus?.connections?.youtube) {
      youtubeData = await convex.query(api.youtube.getYouTubeData, {
        userId: session.user.id
      }).catch(() => null);
    }
    
    // Add YouTube data if available
    if (youtubeData) {
      accounts.push({
        platform: 'youtube',
        username: youtubeData.data?.snippet?.title || 'YouTube Channel',
        metadata: {
          channelId: youtubeData.data?.id,
          subscribers: youtubeData.subscriberCount,
          videos: youtubeData.videoCount,
          views: youtubeData.viewCount
        },
        lastUpdated: new Date(youtubeData.timestamp),
        isActive: true
      });
    }
    
    // Get Gmail data if connected
    let gmailData = null;
    if (connectionStatus?.connections?.gmail) {
      gmailData = await convex.query(api.gmail.getGmailData, {
        userId: session.user.id
      }).catch(() => null);
    }
    
    // Add Gmail data if available
    if (gmailData) {
      accounts.push({
        platform: 'gmail',
        username: gmailData.data?.emailAddress || 'Gmail Account',
        metadata: {
          messagesTotal: gmailData.data?.messagesTotal,
          threadsTotal: gmailData.data?.threadsTotal
        },
        lastUpdated: new Date(gmailData.timestamp),
        isActive: true
      });
    }

    return NextResponse.json({
      accounts: accounts.map(account => ({
        platform: account.platform,
        username: account.username,
        metadata: account.metadata,
        lastUpdated: account.lastUpdated || account.updatedAt,
        isActive: account.isActive !== undefined ? account.isActive : 
          (account.accessToken && (!account.expiresAt || new Date(account.expiresAt) > new Date()))
      }))
    })

  } catch (error) {
    console.error('[CONNECTED_PLATFORMS_ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 