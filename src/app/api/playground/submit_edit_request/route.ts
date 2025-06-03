import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';
import dotenv from 'dotenv';

dotenv.config();

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
      request_title,
      prompt_title,
      edited_by,
      justification,
      old_prompt,
      new_prompt,
      status = 'Pending',
      synced = false
    } = body;
    if (!request_title || !prompt_title || !edited_by || !justification || !old_prompt || !new_prompt) {
      return NextResponse.json({ error: 'request_title, prompt_title, edited_by, justification, old_prompt, and new_prompt are required' }, { status: 400 });
    }

    // Prepare backend request body
    const backendRequestBody = {
      request_title,
      prompt_title,
      edited_by,
      justification,
      old_prompt,
      new_prompt,
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
