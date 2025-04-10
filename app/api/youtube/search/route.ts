import { NextResponse } from 'next/server';
import { YouTubeService } from '@/app/lib/services/youtube';
import { auth } from '@/app/auth';
import prisma from '@/app/lib/prisma';
import { RAGSystem } from '@/app/lib/rag';

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

    const rag = new RAGSystem();
    const youtubeService = new YouTubeService(session.user.id, rag);
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