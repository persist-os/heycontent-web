import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    const { apiKey } = extractAuthInfo(authHeader);
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      request_title,
      prompt_title,
      justification,
      old_description,
      new_description,
      old_instructions,
      new_instructions,
      status = 'Pending',
      synced = false
    } = body;

    if (!name || !request_title || !prompt_title || !justification || !old_description || !new_description || !old_instructions || !new_instructions) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Prepare backend request body
    const backendRequestBody = {
      name,
      request_title,
      prompt_title,
      justification,
      old_description,
      new_description,
      old_instructions,
      new_instructions,
      status,
      synced
    };

    // Proxy the request to the backend
    const response = await fetch(`${BACKEND_URL}/api/v1/prompt-playground/submit_edit_request`, {
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
      return NextResponse.json({ error: data.error || 'Edit request submission failed' }, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error', detail: String(e) }, { status: 500 });
  }
}
