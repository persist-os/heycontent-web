import { NextRequest, NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

export async function POST(req: NextRequest) {
  // Extract API key and user ID from Authorization header
  const authHeader = req.headers.get('authorization');
  const { apiKey, userId } = extractAuthInfo(authHeader);
  
  if (!apiKey || !userId) {
    return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
  }

  // Parse any additional body fields (expires_at, scope)
  const body = await req.json();
  const { expires_at, scope } = body;

  // Backend API URL (adjust if needed)
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  const endpoint = `${backendUrl}/api/v1/instagram/refresh-demographics`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`, // <-- forward the API key!
      },
      body: JSON.stringify({
        user_id: userId,
        expires_at,
        scope,
      }),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to refresh demographics', details: error?.toString() }, { status: 500 });
  }
} 