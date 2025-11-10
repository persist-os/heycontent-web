import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * POST /api/widgets/rate
 * Thin wrapper for rating widget outputs - forwards to backend
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
      console.warn(`[${requestId}] Widget rating: Authentication failed`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body
    const body = await request.json();

    // Validate required fields
    if (!body.user_id || !body.output_id || body.rating === undefined) {
      console.warn(`[${requestId}] Widget rating: Missing required fields`);
      return NextResponse.json(
        { error: 'Bad Request', detail: 'user_id, output_id, and rating are required' },
        { status: 400 }
      );
    }

    // Validate rating value (0 or 1)
    if (body.rating !== 0 && body.rating !== 1) {
      console.warn(`[${requestId}] Widget rating: Invalid rating value`);
      return NextResponse.json(
        { error: 'Bad Request', detail: 'rating must be 0 or 1' },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Forwarding widget rating to backend`, {
      output_id: body.output_id,
      rating: body.rating,
      has_feedback: !!body.feedback_text,
      timestamp: new Date().toISOString()
    });

    // Forward to backend
    const response = await fetch(`${BACKEND_URL}/api/v1/widgets/rate`, {
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
      console.error(`[${requestId}] Widget rating failed:`, {
        status: response.status,
        error: data.error || data.detail
      });
      return NextResponse.json(
        { error: data.error || data.detail || 'Widget rating failed' },
        { status: response.status }
      );
    }

    console.log(`[${requestId}] Widget rating successful`);

    return NextResponse.json(data);

  } catch (error) {
    console.error(`[${requestId}] Widget rating error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



