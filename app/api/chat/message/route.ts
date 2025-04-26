import { NextResponse } from 'next/server';

const BACKEND_URL = 'https://backend.hicontent.co';

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[${requestId}] Chat message request started`, {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  });

  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[${requestId}] Authentication failed: No Authorization header or invalid format`);
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
    }
    
    // Extract the API key from the Authorization header
    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (!apiKey) {
      console.warn(`[${requestId}] Authentication failed: No API key found`);
      return NextResponse.json({ error: 'Unauthorized - Missing API key' }, { status: 401 });
    }

    const body = await request.json();
    const { query, is_first_message, session_id, user_id: requestUserId } = body;

    if (!query) {
      console.warn(`[${requestId}] Invalid request: Missing query`);
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // User ID can come from either the API key or the request body
    let user_id = requestUserId; // First try to use the user_id from the request body
    
    // If not provided in the request, extract from API key
    if (!user_id) {
      const apiKeyParts = apiKey.split('_');
      if (apiKeyParts.length >= 2) {
        user_id = apiKeyParts[1];
      }
    }
    
    if (!user_id) {
      console.warn(`[${requestId}] Authentication failed: Could not determine user_id`);
      return NextResponse.json({ error: 'Unauthorized - Invalid API key format or missing user_id' }, { status: 401 });
    }
    
    // Log the request details
    console.info(`[${requestId}] Processing chat message`, {
      session_id: session_id || 'null',
      is_first_message: !!is_first_message,
      query_length: query?.length,
      has_api_key: !!apiKey,
      user_id: user_id
    });

    const response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        user_id,
        query,
        is_first_message: is_first_message === true,
        session_id: is_first_message === true ? null : (session_id || null)
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`[${requestId}] Backend API error:`, {
        status: response.status,
        error: errorData
      });
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();

    const totalDuration = Date.now() - startTime;

    console.info(`[${requestId}] Request completed successfully`, {
      duration_ms: totalDuration,
      chat_response_length: data.chat_response?.length || data.response?.length || 0,
      suggestions_count: data.suggestions?.length || 0
    });

    // Ensure we're not double-stringifying the response
    const responseData = {
      chat_response: data.chat_response || data.response,
      suggestions: data.suggestions || [],
      session_id: data.session_id,
      metadata: {
        request_id: requestId,
        processing_time_ms: totalDuration
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[${requestId}] Request failed`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration_ms: totalDuration,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      metadata: {
        request_id: requestId,
        processing_time_ms: totalDuration
      }
    }, { status: 500 });
  }
}