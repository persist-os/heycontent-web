import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    const { apiKey, userId } = extractAuthInfo(authHeader);
    
    if (!apiKey) {
      console.warn(`[${requestId}] Authentication failed: No Authorization header or invalid format`);
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
    }

    if (!userId) {
      console.warn(`[${requestId}] Invalid API key format`);
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 401 });
    }

    // Parse request body (optional, but useful for future parameters)
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // Prepare the backend request
    const backendUrl = `${BACKEND_URL}/api/v1/content_hub/generate`;
    const requestBody = { 
      user_id: userId,  // Backend expects snake_case
      ...body
    };

    console.log(`[${requestId}] Calling backend content hub generate`, {
      userId,
      backendUrl
    });

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
      const errorData = await response.json().catch(() => ({}));
      console.error(`[${requestId}] Backend error:`, {
        status: response.status,
        statusText: response.statusText,
        url: backendUrl,
        error: errorData,
        requestBody
      });
      return NextResponse.json({ 
        error: errorData.error || errorData.detail || 'Backend error', 
        details: errorData,
        backendStatus: response.status,
        backendUrl: backendUrl
      }, { status: response.status });
    }

    const data = await response.json();
    
    console.log(`[${requestId}] Content hub insights generated successfully`, {
      userId,
      success: data.success
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error(`[${requestId}] Error processing content hub generation:`, error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 