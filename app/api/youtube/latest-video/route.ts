import { NextResponse } from 'next/server';
import { YouTubeService } from '@/lib/services/youtube';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface YouTubeMetadata {
  channelId: string;
  subscribers?: string;
  videos?: string;
  views?: string;
}

function isYouTubeMetadata(metadata: any): metadata is YouTubeMetadata {
  return metadata && typeof metadata === 'object' && typeof metadata.channelId === 'string';
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's YouTube account
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        socialAccounts: {
          where: { 
            platform: 'youtube',
            isConnected: true
          }
        }
      }
    });

    const youtubeAccount = user?.socialAccounts[0];
    if (!youtubeAccount) {
      return NextResponse.json({ error: 'YouTube account not connected' }, { status: 400 });
    }

    if (!isYouTubeMetadata(youtubeAccount.metadata)) {
      return NextResponse.json({ error: 'Invalid YouTube account metadata' }, { status: 400 });
    }

    const youtubeService = new YouTubeService(session.user.id);
    const analysis = await youtubeService.getLatestVideoAnalysis(youtubeAccount.metadata.channelId);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Error getting latest video analysis:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get latest video analysis' },
      { status: 500 }
    );
  }
} 