import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * POST /api/widgets/run
 * Thin wrapper for widget execution - forwards to backend
 */
export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    // Extract auth
    const authHeader = request.headers.get('Authorization') || '';
    const bearerPrefix = 'Bearer ';
    const apiKey = authHeader.startsWith(bearerPrefix)
      ? authHeader.slice(bearerPrefix.length).trim()
      : '';

    if (!apiKey) {
      console.warn(`[${requestId}] Widget run: Authentication failed`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body once
    const body = await request.json();

    // Validate required fields
    if (!body.user_id || !body.widget_id || !body.project_id) {
      console.warn(`[${requestId}] Widget run: Missing required fields`);
      return NextResponse.json(
        { error: 'Bad Request', detail: 'user_id, widget_id, and project_id are required' },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Forwarding widget run to backend`, {
      widget_id: body.widget_id,
      project_id: body.project_id,
      timestamp: new Date().toISOString()
    });

    // Forward to backend
    const response = await fetch(`${BACKEND_URL}/api/v1/widgets/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[${requestId}] Widget run failed:`, {
        status: response.status,
        error: data.error || data.detail
      });
      return NextResponse.json(
        { error: data.error || data.detail || 'Widget execution failed' },
        { status: response.status }
      );
    }

    console.log(`[${requestId}] Widget run successful:`, {
      output_id: data.output_id,
      note_id: data.note_id,
      prompt_count: data.prompts?.length || 0
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error(`[${requestId}] Widget run error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

