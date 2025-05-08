import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const body = await request.json();
    const userId = body.userId;
    if (!userId) {
      return NextResponse.json({ status: 'error', error: 'userId is required' }, { status: 400 });
    }

    // Proxy the request to FastAPI backend
    const res = await fetch(`${backendUrl}/instagram/auth-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    // Return backend response directly (status, auth_url)
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error in Next.js Instagram auth-url route:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to get Instagram auth URL' },
      { status: 500 }
    );
  }
}



