import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[${requestId}] Authentication failed: No Authorization header or invalid format`);
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
    }
    
    // Extract the API key
    const apiKey = authHeader.substring(7).replace(/"/g, '');
    
    // Extract user ID from API key
    const apiKeyParts = apiKey.split('_');
    const user_id = apiKeyParts.length >= 2 && apiKeyParts[0] === 'heycontent' ? apiKeyParts[1] : null;
    
    if (!user_id) {
      console.warn(`[${requestId}] Invalid API key format`);
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    
    // Prepare the backend request
    const backendUrl = `${BACKEND_URL}/api/v1/ambient_insights/generate`;
    const requestBody = { user_id, ...body };
    
    // Call backend
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[${requestId}] Backend error:`, errorData);
      return NextResponse.json({ error: 'Backend error', details: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[${requestId}] Error in ambient insights API route:`, error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 