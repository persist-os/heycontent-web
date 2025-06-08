import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { post_id, post_url } = await req.json();
    if (!post_id || !post_url) {
      return NextResponse.json({ status: 'error', error: 'Missing post_id or post_url' }, { status: 400 });
    }

    // Get the user's auth token from cookies or headers
    const token = req.cookies.get('auth_token')?.value || req.headers.get('authorization');
    if (!token) {
      return NextResponse.json({ status: 'error', error: 'Not authenticated' }, { status: 401 });
    }

    // Call the backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.hicontent.co';
    const response = await fetch(`${backendUrl}/api/v1/instagram/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      },
      body: JSON.stringify({ post_id: post_id, post_url: post_url }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
