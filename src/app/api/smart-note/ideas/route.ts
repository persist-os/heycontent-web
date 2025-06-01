import { NextResponse } from 'next/server';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[${requestId}] Smart note ideas request started`, {
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

    const body = await request.json();
    console.log('Request body:', body);
    const { platform = 'web', limit = 5 } = body;
    if (!platform) {
      console.warn(`[${requestId}] Invalid request: Missing platform`);
      return NextResponse.json({ error: 'Platform is required', status: 400 }, { status: 400 });
    }
    // Prepare payload, do NOT send userId
    const payload = { platform, limit };
    // Log the request to the backend
    console.info(`[${requestId}] Sending request to backend API`, {
      url: `${BACKEND_URL}/api/v1/smart-note/ideas/`,
      platform,
      limit
    });
    const response = await fetch(`${BACKEND_URL}/api/v1/smart-note/ideas/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`[${requestId}] Backend API error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: `${BACKEND_URL}/api/v1/smart-note/ideas/`
      });
      throw new Error(`Backend API responded with status: ${response.status} (${response.statusText})`);
    }
    const data = await response.json();
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
    console.error(`[${requestId}] Request failed: ${errorName}`, {
      error: errorMessage,
      stack: errorStack,
      duration_ms: totalDuration,
      timestamp: new Date().toISOString()
    });
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