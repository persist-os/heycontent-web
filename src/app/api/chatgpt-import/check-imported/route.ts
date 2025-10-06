import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = authHeader.substring(7);
    
    // Validate backend URL exists
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!BACKEND_URL) {
      console.error('[chatgpt-import/check-imported] CRITICAL: NEXT_PUBLIC_BACKEND_URL not set!');
      return NextResponse.json(
        { error: 'Configuration error', detail: 'Backend URL not configured' }, 
        { status: 500 }
      );
    }

    const backendEndpoint = `${BACKEND_URL}/api/v1/chatgpt/check-imported`;
    
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      // Forward to backend to check if user has imported
      const response = await fetch(backendEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        return NextResponse.json(error, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json(data);

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout' }, 
          { status: 504 }
        );
      }
      
      if (fetchError instanceof TypeError) {
        console.error('[chatgpt-import/check-imported] Network error:', fetchError.message);
        return NextResponse.json(
          { error: 'Backend connection failed' }, 
          { status: 502 }
        );
      }
      
      throw fetchError;
    }

  } catch (error: any) {
    console.error('[chatgpt-import/check-imported] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', detail: error.message || String(error) },
      { status: 500 }
    );
  }
}

