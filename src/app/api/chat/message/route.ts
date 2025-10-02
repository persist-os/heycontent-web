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
      console.warn(`[${requestId}] Authentication failed`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Chat messages require a valid user_id
    if (!user_id) {
      console.warn(`[${requestId}] Missing or invalid user_id`);
      return NextResponse.json({ error: 'Bad Request', detail: 'user_id is required and must be a non-empty string' }, { status: 400 });
    }

    const body = parsedBody ?? await request.json();
    
    console.log(`[${requestId}] Forwarding chat message to backend`, {
      has_user_id: true,
      has_content: typeof body?.content === 'string' ? body.content.length > 0 : !!body?.content,
      has_file_attachments: Array.isArray(body?.file_attachments) ? body.file_attachments.length : 0,
      timestamp: new Date().toISOString()
    });

    // Forward request to backend with minimal processing
    const response = await fetch(`${BACKEND_URL}/api/v1/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error(`[${requestId}] Backend error:`, response.status, response.statusText);
      return NextResponse.json(
        { error: 'Backend service error' }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[${requestId}] Chat message completed successfully`);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error(`[${requestId}] Request failed:`, error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}