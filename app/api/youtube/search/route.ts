import { NextResponse } from 'next/server';
import { YouTubeService } from '@/lib/services/youtube';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const youtubeService = new YouTubeService(session.user.id);
    const videos = await youtubeService.searchVideosByTitle(query);

    return NextResponse.json({ videos });
  } catch (error: any) {
    console.error('Error searching videos:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search videos' },
      { status: 500 }
    );
  }
} 