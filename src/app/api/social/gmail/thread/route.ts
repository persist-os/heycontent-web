import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userId, email, threadId } = await req.json();
    if (!userId || !email || !threadId) {
      return NextResponse.json({ status: 'error', error: 'Missing userId, email, or threadId' }, { status: 400 });
    }

    // Get the user's auth token from cookies or headers
    const token = req.cookies.get('auth_token')?.value || req.headers.get('authorization');
    if (!token) {
      return NextResponse.json({ status: 'error', error: 'Not authenticated' }, { status: 401 });
    }

    // Call the backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${backendUrl}/api/v1/gmail/thread`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userId, email, thread_id: threadId }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 