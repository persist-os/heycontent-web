import { NextRequest, NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const { apiKey } = extractAuthInfo(authHeader);

    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { questionId, answer, widgetId, projectId } = body;
    
    if (!questionId || !answer || !widgetId || !projectId) {
      return NextResponse.json({ 
        error: 'Missing required fields (questionId, answer, widgetId, projectId)' 
      }, { status: 400 });
    }
    
    // ✅ Proxy to backend - handles Convex update + Redis counter decrement + widget re-queue
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/widgets/${widgetId}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ answer, project_id: projectId })
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.error || 'Backend request failed' }, 
        { status: backendResponse.status }
      );
    }
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[API Route Error] /api/widgetQuestions/answer:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error.message 
    }, { status: 500 });
  }
}

