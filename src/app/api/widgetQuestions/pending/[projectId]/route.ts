import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const authHeader = request.headers.get('Authorization');
    const { apiKey } = extractAuthInfo(authHeader);

    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Query Convex for pending widget questions
    const questions = await convex.query(api.widgetQuestionsQueries.getPendingQuestions, {
      projectId: projectId as any
    });
    
    return NextResponse.json({ 
      success: true, 
      data: { questions } 
    });

  } catch (error: any) {
    console.error('[API Route Error] /api/widgetQuestions/pending/[projectId]:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error.message 
    }, { status: 500 });
  }
}

