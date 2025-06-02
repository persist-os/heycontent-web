import { NextResponse } from 'next/server';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[${requestId}] Smart note save request started`, {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  });

  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '').trim();
    if (!apiKey) {
      console.warn(`[${requestId}] Authentication failed: No Authorization header or invalid format`);
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
    }

    // Log incoming request details
    console.info(`[${requestId}] Incoming save request`, {
      method: request.method,
      url: request.url,
      headers: {
        'content-type': request.headers.get('content-type'),
        'authorization': authHeader ? '[REDACTED]' : undefined,
      }
    });

    const body = await request.json();
    console.info(`[${requestId}] Incoming request body`, body);
    const { content, platform, type, templateInput, analysisId } = body;

    // Prepare payload for backend (do NOT send userId)
    const payload: Record<string, any> = { content, platform };
    if (type !== undefined) payload.type = type;
    if (templateInput !== undefined) payload.templateInput = templateInput;
    if (analysisId !== undefined) payload.analysisId = analysisId;

    // Log the backend request
    console.info(`[${requestId}] Proxying to backend API`, {
      url: `${BACKEND_URL}/api/v1/smart-note/save`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey ? `${apiKey.slice(0, 8)}...[REDACTED]` : undefined,
      },
      payload: payload
    });

    // Proxy to backend
    const backendUrl = `${BACKEND_URL}/api/v1/smart-note/save`;
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await backendResponse.json();
    if (!backendResponse.ok) {
      console.error(`[${requestId}] Backend error:`, data);
      return NextResponse.json({ error: data.detail || data.error || 'Backend error' }, { status: backendResponse.status });
    }

    const totalDuration = Date.now() - startTime;

    // Validate the response data structure
    if (!data || typeof data !== 'object') {
      console.error(`[${requestId}] Invalid response data format:`, {
        dataType: typeof data,
        data: data ? JSON.stringify(data).substring(0, 100) + '...' : 'null'
      });
      throw new Error('Invalid response data format from backend');
    }

    // Log success with more details
    console.info(`[${requestId}] Request completed successfully`, {
      duration_ms: totalDuration,
      save_success: data.success || false,
      note_id: data.noteId || null,
      response_size: JSON.stringify(data).length
    });

    // Return the response data
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
      error: 'Save Failed',
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