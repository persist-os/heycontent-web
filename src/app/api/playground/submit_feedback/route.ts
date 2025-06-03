import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  try {
    // Get API key and user ID from Authorization header
    const authHeader = request.headers.get('Authorization');
    const { apiKey } = extractAuthInfo(authHeader);
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
    }

    const body = await request.json();
    const { name, prompt_title, feedback, model_output, rating } = body;
    if (!name || !prompt_title || !feedback || !model_output || !rating) {
      return NextResponse.json({ error: 'name, prompt_title, feedback, model_output, and rating are required' }, { status: 400 });
    }

    // Prepare backend request body
    const backendRequestBody = { name, prompt_title, feedback, model_output, rating };

    // Proxy the request to the backend
    const response = await fetch(`${BACKEND_URL}/api/v1/prompt-playground/submit_feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(backendRequestBody)
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Feedback submission failed' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', detail: String(error) }, { status: 500 });
  }
}
