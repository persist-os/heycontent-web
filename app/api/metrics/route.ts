import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { YouTubeService } from '@/app/lib/services/youtube';
import { GmailService } from '@/app/lib/services/gmail';
import prisma from '@/app/lib/prisma';
import type { Account, SocialAccount, Prisma } from '@prisma/client';
import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';

type YouTubeMetadata = {
  channelId: string;
  channelTitle?: string;
  [key: string]: string | undefined;
};

function isYouTubeMetadata(metadata: Prisma.JsonValue | null): metadata is YouTubeMetadata {
  if (!metadata || typeof metadata !== 'object') return false;
  const m = metadata as Record<string, unknown>;
  return typeof m.channelId === 'string';
}

interface GoogleAccount {
  id: string;
  provider: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
}

interface ConnectedSocialAccount {
  id: string;
  platform: string;
  isConnected: boolean;
  updatedAt: Date;
  profileUrl: string | null;
  metadata: Prisma.JsonValue;
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const metric = searchParams.get('metric');

    // Get user's accounts with detailed token info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accounts: {
          select: {
            id: true,
            provider: true,
            access_token: true,
            expires_at: true,
            refresh_token: true
          }
        },
        socialAccounts: {
          where: { isConnected: true },
          select: {
            id: true,
            platform: true,
            profileUrl: true,
            metadata: true,
            isConnected: true,
            updatedAt: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Log account status
    const googleAccount = user.accounts.find((acc: GoogleAccount) => acc.provider === 'google');
    const youtubeAccount = user.socialAccounts.find((acc: ConnectedSocialAccount) => acc.platform === 'youtube');
    
    console.log('Account status:', {
      hasGoogleAccount: !!googleAccount,
      googleTokenExpiry: googleAccount?.expires_at ? new Date(googleAccount.expires_at * 1000) : 'No expiry',
      hasYoutubeAccount: !!youtubeAccount,
      youtubeConnected: youtubeAccount?.isConnected,
      youtubeLastUpdate: youtubeAccount?.updatedAt
    });

    switch (metric) {
      case 'last_video_views': {
        if (!youtubeAccount) {
          return NextResponse.json({ error: 'YouTube account not connected' }, { status: 400 });
        }

        if (!googleAccount) {
          return NextResponse.json({ error: 'Google account not found' }, { status: 400 });
        }

        if (!isYouTubeMetadata(youtubeAccount.metadata)) {
          return NextResponse.json({ 
            error: 'Invalid YouTube metadata',
            metadata: youtubeAccount.metadata
          }, { status: 400 });
        }

        try {
          const youtubeService = new YouTubeService(session.user.id);
          const channelId = youtubeAccount.metadata.channelId;
          
          console.log('Attempting to fetch YouTube data:', {
            channelId,
            userId: session.user.id,
            hasAccessToken: !!googleAccount.access_token,
            tokenExpiry: googleAccount.expires_at ? new Date(googleAccount.expires_at * 1000) : 'No expiry',
            metadata: youtubeAccount.metadata
          });

          // First test the connection
          const connectionTest = await youtubeService.testConnection(channelId);
          if (!connectionTest.success) {
            return NextResponse.json({ 
              error: 'Failed to connect to YouTube',
              details: connectionTest.error,
              tokenExpiry: googleAccount.expires_at ? new Date(googleAccount.expires_at * 1000) : null
            }, { status: 500 });
          }

          const videoIds = await youtubeService.getRecentVideoIds(channelId);
          if (videoIds.length === 0) {
            return NextResponse.json({ views: 0, message: 'No videos found' });
          }

          const lastVideoMetrics = await youtubeService.getVideoMetrics(videoIds[0]);
          return NextResponse.json(lastVideoMetrics);
        } catch (error) {
          console.error('YouTube API error:', error);
          return NextResponse.json({ 
            error: 'Failed to fetch YouTube metrics',
            details: error instanceof Error ? error.message : 'Unknown error',
            tokenExpiry: googleAccount.expires_at ? new Date(googleAccount.expires_at * 1000) : 'No expiry'
          }, { status: 500 });
        }
      }

      case 'partnership_emails': {
        const gmailAccount = user.accounts.find((acc: GoogleAccount) => acc.provider === 'google');
        if (!gmailAccount) {
          return NextResponse.json({ error: 'Gmail account not connected' }, { status: 400 });
        }

        const gmailService = new GmailService(gmailAccount.id);
        const partnerships = await gmailService.getPartnershipEmails();
        
        return NextResponse.json({
          total: partnerships.length,
          unread: partnerships.filter(p => !p.isRead).length,
          highPriority: partnerships.filter(p => p.analysis.priority === 'high').length,
          averageDealValue: partnerships.reduce((sum, p) => sum + (p.analysis.dealValue || 0), 0) / partnerships.length
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid metric requested' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in metrics route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 