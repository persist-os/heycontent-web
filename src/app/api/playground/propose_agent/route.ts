import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  try {
    if (!BACKEND_URL) {
      console.error('BACKEND_URL is not defined in environment variables.');
      return NextResponse.json({ error: 'Server configuration error: Backend URL not set.' }, { status: 500 });
    }

    const authHeader = request.headers.get('Authorization');
    const { apiKey } = extractAuthInfo(authHeader);

    const requestBody = await request.json();

    const backendEndpoint = `${BACKEND_URL}/api/v1/prompt-playground/submit-agent-proposal`;

    const response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey ?? ''}`,
      },
      body: JSON.stringify(requestBody),
    });

    // Try to parse the response body regardless of status for more detailed error reporting
    const responseData = await response.json().catch(() => {
      // If JSON parsing fails, use a generic error based on status text
      return { error: `Backend error: ${response.statusText || 'Failed to process request'}`, detail: null };
    });

    if (!response.ok) {
      console.error(`Backend error from ${backendEndpoint}: ${response.status}`, responseData);
      // FastAPI often returns errors in { "detail": "message" }
      return NextResponse.json({ error: responseData.detail || responseData.error || 'An error occurred with the backend service.' }, { status: response.status });
    }

    return NextResponse.json(responseData, { status: response.status });

  } catch (error: any) {
    console.error('Error in /api/playground/propose_agent POST handler:', error);
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'An unexpected error occurred on the server.' }, { status: 500 });
  }
}