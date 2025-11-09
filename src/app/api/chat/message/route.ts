import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    // Local helper: normalize Authorization and identity once per request
    const normalizeAuthAndIdentity = async () => {
      const authHeader = request.headers.get('Authorization') || '';
      const bearerPrefix = 'Bearer ';
      const apiKey = authHeader.startsWith(bearerPrefix)
        ? authHeader.slice(bearerPrefix.length).trim()
        : '';

      // Attempt to read body.user_id without consuming the body twice
      // We will parse once here and reuse below
      let parsedBody: any = undefined;
      try {
        parsedBody = await request.clone().json();
      } catch {
        parsedBody = undefined;
      }

      const user_id = typeof parsedBody?.user_id === 'string' && parsedBody.user_id.trim().length > 0
        ? parsedBody.user_id.trim()
        : '';

      return { apiKey, user_id, parsedBody } as const;
    };

    const { apiKey, user_id, parsedBody } = await normalizeAuthAndIdentity();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Chat messages require a valid user_id
    if (!user_id) {
      return NextResponse.json({ error: 'Bad Request', detail: 'user_id is required and must be a non-empty string' }, { status: 400 });
    }

    const body = parsedBody ?? await request.json();
    
    // Forward request to backend streaming endpoint
    const response = await fetch(`${BACKEND_URL}/api/v1/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error(`[${requestId}] Backend streaming error:`, response.status, response.statusText);
      return NextResponse.json(
        { error: 'Backend streaming service error' }, 
        { status: response.status }
      );
    }

    // Return streaming response
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });

  } catch (error) {
    console.error(`[${requestId}] Request failed:`, error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}