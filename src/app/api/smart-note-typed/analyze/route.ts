import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[${requestId}] Smart Note Typed analysis request started`, {
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
    
    if (!userId) {
      console.warn(`[${requestId}] Authentication failed: Could not determine user_id from API key`);
      return NextResponse.json({ error: 'Unauthorized - Invalid API key format or missing user_id' }, { status: 401 });
    }

    const body = await request.json();
    console.log(`[${requestId}] Request body:`, body);

    const { 
      noteId, 
      content, 
      title, 
      type, 
      platform, 
      tags = [], 
      important = false, 
      references = [] 
    } = body;

    // Validate required fields
    if (!content || !title || !type) {
      console.warn(`[${requestId}] Invalid request: Missing required fields`);
      return NextResponse.json({ 
        error: 'Missing required fields: content, title, and type are required' 
      }, { status: 400 });
    }

    // Prepare the backend request body
    const backendRequestBody = {
      noteId,
      content,
      title,
      type,
      platform: platform || 'web',
      tags,
      important,
      references
    };

    console.info(`[${requestId}] Processing typed smart note analysis`, {
      type,
      title,
      platform: platform || 'web',
      contentLength: content.length,
      userId
    });

    // Call the backend typed analysis endpoint
    const backendUrl = `${BACKEND_URL}/api/v1/smart-note-typed/analyze`;
    console.info(`[${requestId}] Sending request to backend API`, {
      url: backendUrl,
      type
    });

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(backendRequestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`[${requestId}] Backend API error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: backendUrl
      });
      return NextResponse.json({ 
        error: errorData?.error || errorData?.detail || 'Backend error',
        details: errorData 
      }, { status: response.status });
    }

    const data = await response.json();
    const totalDuration = Date.now() - startTime;

    // Log success with details
    console.info(`[${requestId}] Request completed successfully`, {
      duration_ms: totalDuration,
      analysis_success: data.success || false,
      note_type: type,
      agent_used: data.data?.agent_used,
      has_analysis: !!(data.data && data.data.analysis),
      response_size: JSON.stringify(data).length
    });

    return NextResponse.json(data);
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'UnknownError';

    console.error(`[${requestId}] Request failed: ${errorName}`, {
      error: errorMessage,
      stack: errorStack,
      duration_ms: totalDuration,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: false,
      error: 'Typed Analysis Failed',
      message: errorMessage,
      errorType: errorName,
      metadata: {
        request_id: requestId,
        processing_time_ms: totalDuration,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
} 