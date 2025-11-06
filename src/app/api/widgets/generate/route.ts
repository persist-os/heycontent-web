import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * POST /api/widgets/generate
 * Thin wrapper for widget generation - forwards to backend
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
      console.warn(`[${requestId}] Widget generate: Authentication failed`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body once
    const body = await request.json();

    // Validate required fields
    if (!body.user_id || !body.project_id || !body.widget_description) {
      console.warn(`[${requestId}] Widget generate: Missing required fields`);
      return NextResponse.json(
        { error: 'Bad Request', detail: 'user_id, project_id, and widget_description are required' },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Forwarding widget generation to backend`, {
      project_id: body.project_id,
      description_length: body.widget_description?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Forward to backend
    const response = await fetch(`${BACKEND_URL}/api/v1/project-widgets/generate`, {
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
      console.error(`[${requestId}] Widget generation failed:`, {
        status: response.status,
        error: data.error || data.detail
      });
      return NextResponse.json(
        { error: data.error || data.detail || 'Widget generation failed' },
        { status: response.status }
      );
    }

    console.log(`[${requestId}] Widget generated successfully:`, {
      success: data.success,
      widgets_id: data.widgets_id,
      widget_type: data.metadata?.widget_type
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error(`[${requestId}] Widget generate error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

