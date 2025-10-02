import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[${requestId}] Lab message request started`, {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  });

  try {
    // Get API key and user ID from Authorization header
    const authHeader = request.headers.get('Authorization');
    const { apiKey, userId } = extractAuthInfo(authHeader);
    
    if (!apiKey) {
      console.warn(`[${requestId}] Authentication failed: No Authorization header or invalid format`);
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
    }

    const body = await request.json();
    
    // Transform thinking lab payload to chat API format
    const {
      user_id,
      query,
      is_first_message,
      session_identifier,
      notepad_context,
      workspace_context,
      use_vector_search,
      intent_analysis,
      vector_search_metadata
    } = body;

    console.log(`[${requestId}] Received lab request:`, {
      user_id,
      query_length: query?.length || 0,
      is_first_message,
      session_identifier,
      has_notepad_context: !!notepad_context,
      has_workspace_context: !!workspace_context,
      use_vector_search,
      has_intent_analysis: !!intent_analysis,
      has_vector_search_metadata: !!vector_search_metadata
    });

    if (!query) {
      console.warn(`[${requestId}] Invalid request: Missing query`);
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Always extract user_id from API key, never from client
    const authenticated_user_id = userId;
    if (!authenticated_user_id) {
      console.warn(`[${requestId}] Authentication failed: Could not determine user_id from API key`);
      return NextResponse.json({ error: 'Unauthorized - Invalid API key format or missing user_id' }, { status: 401 });
    }

    // Build payload for chat API
    const chatRequestBody: any = {
      user_id: authenticated_user_id,
      query,
      is_first_message: is_first_message === true,
      session_id: is_first_message === true ? null : (session_identifier || null),
      notepad_context,
      vector_search_metadata: use_vector_search ? vector_search_metadata : undefined
    };

    // Add workspace context as content_context if provided
    if (workspace_context) {
      chatRequestBody.content_context = {
        platform: 'thinking_lab',
        content: workspace_context
      };
    }

    console.log(`[${requestId}] Forwarding to chat API:`, {
      url: `${BACKEND_URL}/api/v1/chat/message`,
      user_id: authenticated_user_id,
      query_length: query.length,
      has_notepad_context: !!chatRequestBody.notepad_context,
      has_content_context: !!chatRequestBody.content_context
    });

    // Forward to chat message endpoint
    const response = await fetch(`${BACKEND_URL}/api/v1/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(chatRequestBody)
    });

    if (!response.ok) {
      console.error(`[${requestId}] Chat API error: ${response.status}`);
      const errorText = await response.text();
      return NextResponse.json({
        error: 'Chat API Error',
        message: `Backend responded with status: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Backend wraps response in { success: true, data: {...} }
    const backendData = data.success ? data.data : data;
    
    // Transform chat API response to thinking lab format
    const labResponse = {
      response_content: backendData.response || backendData.chat_response || 'No response received',
      session_identifier: backendData.session_id || session_identifier,
      user_input: backendData.user_message || query,
      suggestions: backendData.suggestions || [],
      metadata: {
        ...backendData.metadata,
        request_id: requestId,
        processing_time_ms: Date.now() - startTime
      }
    };

    console.log(`[${requestId}] Lab message request completed`, {
      duration_ms: Date.now() - startTime,
      response_length: labResponse.response_content?.length || 0,
      suggestions_count: labResponse.suggestions?.length || 0,
      has_notepad_context: !!chatRequestBody.notepad_context
    });

    return NextResponse.json(labResponse);

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[${requestId}] Lab message request failed`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: totalDuration
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
