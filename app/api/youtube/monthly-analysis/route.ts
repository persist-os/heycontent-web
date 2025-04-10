import { NextResponse } from 'next/server';
import { YouTubeService } from '@/app/lib/services/youtube';
import { auth } from '@/app/auth';
import prisma from '@/app/lib/prisma';
import { RAGSystem } from '@/app/lib/rag';

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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { month, year } = body;

    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month are required' },
        { status: 400 }
      );
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

    const rag = new RAGSystem();
    const youtubeService = new YouTubeService(session.user.id, rag);
    const analysis = await youtubeService.getMonthlyContentAnalysis(month, year);

    if (!analysis.videos.length) {
      return NextResponse.json({
        videos: [],
        summary: {
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          topPerformingVideo: '',
          commonTopics: [],
          engagementPatterns: [],
          recommendedStrategies: ['No videos found for this month']
        }
      });
    }

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Error getting monthly content analysis:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get monthly content analysis' },
      { status: 500 }
    );
  }
} 