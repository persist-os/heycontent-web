import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    // Get API key and user ID from Authorization header
    const authHeader = request.headers.get('Authorization');
    const { apiKey, userId } = extractAuthInfo(authHeader);
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
    }

    const body = await request.json();
    
    // Transform main chat payload to streaming chat API format
    const {
      user_id,
      query,
      is_first_message,
      session_identifier,
      notepad_context,
      workspace_context,
      project_id,
      widget_id,
      widget_output_id,
      conversation_type,
      file_attachments,
      content_context,
      vector_search_metadata
    } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Always extract user_id from API key, never from client
    const authenticated_user_id = userId;
    if (!authenticated_user_id) {
      return NextResponse.json({ error: 'Unauthorized - Invalid API key format or missing user_id' }, { status: 401 });
    }

    // Build payload for streaming chat API
    const chatRequestBody: any = {
      user_id: authenticated_user_id,
      query,
      is_first_message: is_first_message === true,
      session_id: session_identifier || null,  // Always pass session_id (frontend creates conversation)
      notepad_context,
      content_context: content_context || {},
      vector_search_metadata: vector_search_metadata || {},
      file_attachments: file_attachments || []
    };

    // Add workspace context if provided
    if (workspace_context) {
      chatRequestBody.content_context = {
        platform: 'main_chat',
        content: workspace_context,
        ...chatRequestBody.content_context
      };
    }

    // Add project/widget context if provided
    if (project_id) {
      chatRequestBody.project_id = project_id;
    }
    if (widget_id) {
      chatRequestBody.widget_id = widget_id;
    }
    if (widget_output_id) {
      chatRequestBody.widget_output_id = widget_output_id;
    }
    if (conversation_type) {
      chatRequestBody.conversation_type = conversation_type;
    }

    // Forward to streaming chat endpoint
    const response = await fetch(`${BACKEND_URL}/api/v1/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(chatRequestBody)
    });

    if (!response.ok) {
      console.error(`[${requestId}] Streaming chat API error: ${response.status}`);
      const errorText = await response.text();
      return NextResponse.json({
        error: 'Streaming Chat API Error',
        message: `Backend responded with status: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    // Proxy the streaming response back to client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[${requestId}] Chat stream request failed`, {
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
