import { NextResponse } from 'next/server';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  const debug = (...args: any[]) => console.log('[SMART-NOTE-METADATA]', ...args);
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  // 🚨 STACK TRACE DEBUG - FIND WHERE THIS IS CALLED FROM
  console.error('🚨 METADATA API CALLED FROM:', new Error().stack);

  console.log(`[${requestId}] Smart note metadata generation request started`, {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  });

  try {
    debug('--- New Request ---');
    debug('Request method:', request.method);
    debug('Request url:', request.url);
    if (process.env.NODE_ENV !== 'production') {
      debug('Request headers:', JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2));
    } else {
      debug('Request headers: [REDACTED]');
    }

    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    debug('Extracted Authorization header:', authHeader);
    const apiKey = authHeader?.replace('Bearer ', '').trim();
    debug('Extracted apiKey:', apiKey);
    
    if (!apiKey) {
      console.warn(`[${requestId}] Authentication failed: No Authorization header or invalid format`);
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
    }

    const body = await request.json();
    debug('Request body:', body);
    
    const { noteId, noteContent } = body;
    debug('Parsed request data:', { noteId, noteContent: noteContent?.length });
    
    // DUPLICATE DETECTION LOG
    console.log(`🔍 [DUPLICATE CHECK] ${requestId}:`, {
      noteId,
      contentLength: noteContent?.length,
      contentHash: noteContent ? noteContent.substring(0, 50) + '...' : 'empty',
      timestamp: Date.now()
    });
    
    if (!noteId || !noteContent) {
      console.warn(`[${requestId}] Invalid request: Missing required fields`);
      return NextResponse.json({ error: 'noteId and noteContent are required', status: 400 }, { status: 400 });
    }

    // Prepare payload for backend
    const payload = {
      note_id: noteId,
      note_content: noteContent,
    };
    debug('Prepared payload for backend:', { ...payload, note_content: payload.note_content?.length });

    const headersToSend = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    debug('Headers to backend:', headersToSend);
    debug('Backend URL:', `${BACKEND_URL}/api/v1/smart-notes/generate-metadata`);

    const response = await fetch(`${BACKEND_URL}/api/v1/smart-notes/generate-metadata`, {
      method: 'POST',
      headers: headersToSend,
      body: JSON.stringify(payload)
    });

    debug('Backend response status:', response.status);
    let backendData = null;
    try {
      backendData = await response.clone().json();
      debug('Backend response JSON:', backendData);
    } catch (jsonErr) {
      debug('Backend response not JSON or failed to parse:', jsonErr);
    }

    if (!response.ok) {
      debug('Backend returned error status:', response.status, response.statusText);
      throw new Error(`Backend API responded with status: ${response.status} (${response.statusText})`);
    }

    const data = backendData;
    const totalDuration = Date.now() - startTime;

    // Log success with more details
    console.info(`[${requestId}] Request completed successfully`, {
      duration_ms: totalDuration,
      note_id: data.noteId,
      response_size: JSON.stringify(data).length
    });

    // Return the response data
    return NextResponse.json(data);
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'UnknownError';

    debug('Request failed:', { errorName, errorMessage, errorStack, totalDuration });

    return NextResponse.json({
      success: false,
      error: 'Smart Note Metadata Generation Failed',
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