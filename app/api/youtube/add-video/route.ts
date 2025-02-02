import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { RAGSystem } from '@/app/lib/rag';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoUrl } = await request.json();
    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    const rag = new RAGSystem();
    const videoData = await rag.addYouTubeVideo(videoUrl, session.user.id);

    return NextResponse.json({ success: true, video: videoData });
  } catch (error: any) {
    console.error('Error adding YouTube video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add YouTube video' },
      { status: 500 }
    );
  }
} 