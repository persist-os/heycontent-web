import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { YouTubeService } from '@/app/lib/services/youtube';
import prisma from '@/app/lib/prisma';

type YouTubeMetadata = {
  channelId: string;
  channelTitle?: string;
  [key: string]: string | undefined;
};

function isYouTubeMetadata(metadata: any): metadata is YouTubeMetadata {
  return metadata && typeof metadata === 'object' && typeof metadata.channelId === 'string';
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the Google account with YouTube connection
    const socialAccount = await prisma.socialAccount.findFirst({
      where: {
        userId: session.user.id,
        platform: 'youtube',
        isConnected: true
      },
      select: {
        id: true,
        accessToken: true,
        refreshToken: true,
        expiresAt: true,
        scope: true,
        tokenType: true,
        metadata: true,
        platform: true,
        isConnected: true
      }
    });

    if (!socialAccount) {
      return NextResponse.json({ 
        error: 'YouTube account not connected',
        status: 'disconnected'
      }, { status: 400 });
    }

    if (!isYouTubeMetadata(socialAccount.metadata)) {
      return NextResponse.json({ 
        error: 'Invalid YouTube account metadata',
        status: 'invalid_metadata'
      }, { status: 400 });
    }

    // Log detailed account information
    console.log('Account details:', {
      hasToken: !!socialAccount.accessToken,
      tokenType: socialAccount.tokenType,
      expiresAt: socialAccount.expiresAt,
      grantedScopes: socialAccount.scope?.split(' ') || [],
      youtubeConnected: socialAccount.isConnected,
      platform: socialAccount.platform,
      requiredScopes: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.force-ssl'
      ]
    });

    const youtubeService = new YouTubeService(session.user.id);
    const connectionTest = await youtubeService.testConnection(socialAccount.metadata.channelId);

    if (!connectionTest.success) {
      return NextResponse.json({
        error: connectionTest.error,
        status: 'error',
        details: {
          grantedScopes: socialAccount.scope?.split(' ') || [],
          tokenType: socialAccount.tokenType,
          expiresAt: socialAccount.expiresAt
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      ...connectionTest,
      tokenExpiry: socialAccount.expiresAt,
      scopes: socialAccount.scope?.split(' ') || []
    });
  } catch (error: any) {
    console.error('YouTube test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 