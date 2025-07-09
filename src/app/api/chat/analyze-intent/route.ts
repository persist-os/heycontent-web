import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[${requestId}] Intent analysis request started`, {
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
    const { query } = body;

    if (!query) {
      console.warn(`[${requestId}] Invalid request: Missing query`);
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Always extract user_id from API key, never from client
    const user_id = userId;
    if (!user_id) {
      console.warn(`[${requestId}] Authentication failed: Could not determine user_id from API key`);
      return NextResponse.json({ error: 'Unauthorized - Invalid API key format or missing user_id' }, { status: 401 });
    }

    console.debug(`[${requestId}] Analyzing query intent`, {
      user_id: user_id,
      query_length: query?.length,
      query_preview: query.substring(0, 100) + '...'
    });

    // Prepare the request body for the backend
    const backendRequestBody = {
      user_id,
      query,
      action: 'analyze_intent'
    };

    // Log the request to backend
    console.debug(`[${requestId}] Sending intent analysis request to backend`, {
      url: `${BACKEND_URL}/api/v1/chat/analyze-intent`,
      body: backendRequestBody
    });

    // Call the backend intent analysis endpoint
    const response = await fetch(`${BACKEND_URL}/api/v1/chat/analyze-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(backendRequestBody)
    });

    if (!response.ok) {
      console.error(`[${requestId}] Backend intent analysis failed with status: ${response.status}`);
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    console.debug(`[${requestId}] Backend intent analysis response`, {
      needs_context: data.needs_context,
      confidence_score: data.confidence_score,
      reasoning: data.reasoning
    });

    const totalDuration = Date.now() - startTime;
    console.info(`[${requestId}] Intent analysis completed successfully`, {
      duration_ms: totalDuration,
      needs_context: data.needs_context,
      confidence_score: data.confidence_score
    });

    // Return the intent analysis result
    const responseData = {
      needs_context: data.needs_context,
      confidence_score: data.confidence_score,
      reasoning: data.reasoning,
      metadata: {
        request_id: requestId,
        processing_time_ms: totalDuration
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[${requestId}] Intent analysis failed`, {
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