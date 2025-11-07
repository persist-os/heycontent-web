import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

/**
 * POST /api/v1/feedback/chat_message
 * 
 * Thin wrapper for chat message feedback - forwards to backend.
 */
export async function POST(request: NextRequest) {
  try {
    // Extract auth from header
    const authHeader = request.headers.get('Authorization') || '';
    const bearerPrefix = 'Bearer ';
    const apiKey = authHeader.startsWith(bearerPrefix)
      ? authHeader.slice(bearerPrefix.length).trim()
      : '';

    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body
    const body = await request.json();

    // Forward to backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/feedback/chat_message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.error || data.detail || 'Feedback submission failed' },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[ChatFeedback] Error proxying feedback:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', detail: error.message },
      { status: 500 }
    );
  }
}

