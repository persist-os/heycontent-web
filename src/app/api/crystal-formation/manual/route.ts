import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  console.log('[crystal-formation-api] Manual crystal formation request received');
  
  try {
    // Local helper: normalize Authorization and identity once per request
    const normalizeAuthAndIdentity = async () => {
      const authHeader = request.headers.get('Authorization') || '';
      const bearerPrefix = 'Bearer ';
      const apiKey = authHeader.startsWith(bearerPrefix)
        ? authHeader.slice(bearerPrefix.length).trim()
        : '';

      let parsedBody: any = undefined;
      try {
        parsedBody = await request.clone().json();
      } catch {
        parsedBody = undefined;
      }

      const user_id = typeof parsedBody?.user_id === 'string' && parsedBody.user_id.trim().length > 0
        ? parsedBody.user_id.trim()
        : '';

      return { apiKey, user_id, parsedBody } as const;
    };

    const { apiKey } = await normalizeAuthAndIdentity();

    if (!apiKey) {
      console.warn('[crystal-formation-api] Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    console.log('[crystal-formation-api] Received request:', {
      force: body.force,
      backend_url: BACKEND_URL,
      timestamp: new Date().toISOString()
    });

    // Forward the request to the backend crystal formation endpoint
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/crystal-formation/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    console.log('[crystal-formation-api] Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('[crystal-formation-api] Backend error:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        errorText
      });
      
      // Try to parse as JSON for better error messages
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText || `Backend responded with ${backendResponse.status}: ${backendResponse.statusText}` };
      }
      
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const responseData = await backendResponse.json();
    
    console.log('[crystal-formation-api] Backend response:', {
      success: responseData.success,
      triggered: responseData.triggered,
      message_length: responseData.message?.length || 0,
      has_data: !!responseData.data
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[crystal-formation-api] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        triggered: false,
        message: 'Internal server error occurred',
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('[crystal-formation-api] Crystal formation status request received');
  
  try {
    // Forward the request to the backend crystal formation status endpoint
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/crystal-formation/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    console.log('[crystal-formation-api] Backend status response:', backendResponse.status);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('[crystal-formation-api] Backend status error:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        errorText
      });
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `Backend responded with ${backendResponse.status}: ${backendResponse.statusText}` };
      }
      
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const responseData = await backendResponse.json();
    
    console.log('[crystal-formation-api] Backend status response:', {
      success: responseData.success,
      eligible: responseData.eligible,
      shard_count: responseData.shard_count
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[crystal-formation-api] Status error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
