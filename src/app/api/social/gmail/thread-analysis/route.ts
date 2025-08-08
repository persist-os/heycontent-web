import { NextRequest, NextResponse } from 'next/server';

// Minimal proxy route to match existing Gmail API proxy patterns
export async function POST(req: NextRequest) {
  try {
    const { userId, threadId } = await req.json();
    if (!userId || !threadId) {
      return NextResponse.json(
        { status: 'error', error: 'Missing userId or threadId' },
        { status: 400 }
      );
    }

    // Get the user's auth token from cookies or headers (API key bearer token)
    const token = req.cookies.get('auth_token')?.value || req.headers.get('authorization');
    if (!token) {
      return NextResponse.json(
        { status: 'error', error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Call the backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${backendUrl}/api/v1/gmail/thread-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userId, thread_id: threadId }),
    });

    // Try to parse JSON; if it fails, forward status with raw text
    let data: any;
    try {
      data = await response.json();
    } catch {
      const text = await response.text();
      data = { error: text || 'Unknown error' };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


