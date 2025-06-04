import { NextResponse } from 'next/server';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  const debug = (...args: any[]) => console.log('[SMART-NOTE-IDEAS]', ...args);
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[${requestId}] Smart note ideas request started`, {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  });

  try {
    debug('--- New Request ---');
    debug('Request method:', request.method);
    debug('Request url:', request.url);
    debug('Request headers:', JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2));
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
    const { platform = 'web', limit = 5 } = body;
    debug('Parsed platform:', platform, 'limit:', limit);
    if (!platform) {
      console.warn(`[${requestId}] Invalid request: Missing platform`);
      return NextResponse.json({ error: 'Platform is required', status: 400 }, { status: 400 });
    }
    // Prepare payload, do NOT send userId
    const payload = { platform, limit };
    debug('Prepared payload for backend:', payload);
    const headersToSend = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    debug('Headers to backend:', headersToSend);
    debug('Backend URL:', `${BACKEND_URL}/api/v1/smart-note/ideas/generate`);
    const response = await fetch(`${BACKEND_URL}/api/v1/smart-note/ideas/generate`, {
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
      ideas_count: data.ideas?.length || 0,
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
      error: 'Ideas Generation Failed',
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