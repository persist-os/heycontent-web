import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
    const token = cookies().get('firebase-auth-token')?.value;
    if (!token) {
      console.warn(`[${requestId}] Authentication failed: No token found`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query, is_first_message, session_id } = body;

    if (!query) {
      console.warn(`[${requestId}] Invalid request: Missing query`);
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.info(`[${requestId}] Processing chat message`, {
      session_id,
      is_first_message,
      query_length: query?.length,
      has_token: !!token
    });

    // Extract user_id from token (first part before the first dot)
    const user_id = token.split('.')[0];

    const response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        user_id,
        query,
        is_first_message: is_first_message || false,
        session_id: session_id || Date.now().toString()
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