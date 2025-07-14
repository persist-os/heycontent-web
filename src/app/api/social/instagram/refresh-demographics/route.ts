import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Require Authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
  }
  const apiKey = authHeader.substring(7).replace(/"/g, '');
  // Extract user_id from API key
  const apiKeyParts = apiKey.split('_');
  const user_id = apiKeyParts.length >= 2 && apiKeyParts[0] === 'heycontent' ? apiKeyParts[1] : null;
  if (!user_id) {
    return NextResponse.json({ error: 'Unauthorized - Invalid API key format or missing user_id' }, { status: 401 });
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
        user_id,
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