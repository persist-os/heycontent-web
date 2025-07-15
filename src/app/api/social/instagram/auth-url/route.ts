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

    // Get the Authorization header from the incoming request
    const authHeader = request.headers.get('Authorization');
    
    // Build headers for backend request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Forward Authorization header if present
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Proxy the request to FastAPI backend with correct path and auth
    const res = await fetch(`${backendUrl}/api/v1/instagram/auth-url`, {
      method: 'POST',
      headers,
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



