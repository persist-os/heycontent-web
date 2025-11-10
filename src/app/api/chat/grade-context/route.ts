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
    const { query, vector_search_results } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!vector_search_results || !Array.isArray(vector_search_results)) {
      return NextResponse.json({ error: 'Vector search results are required' }, { status: 400 });
    }

    // Always extract user_id from API key, never from client
    const user_id = userId;
    if (!user_id) {
      return NextResponse.json({ error: 'Unauthorized - Invalid API key format or missing user_id' }, { status: 401 });
    }

    // Prepare the request body for the backend
    const backendRequestBody = {
      user_id,
      query,
      vector_search_results,
      action: 'grade_context' // Tell backend this is a grading request
    };

    // Make request to backend
    const response = await fetch(`${BACKEND_URL}/api/v1/chat/grade-context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(backendRequestBody)
    });

    console.debug(`[${requestId}] Backend response status`, response.status, response.statusText);

    if (!response.ok) {
      console.error(`[${requestId}] Backend API error with status: ${response.status}`);
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.debug(`[${requestId}] Raw backend context grading response`, data);

    const totalDuration = Date.now() - startTime;
    console.info(`[${requestId}] Context grading completed successfully`, {
      duration_ms: totalDuration,
      relevant_items_count: data.relevant_context?.length || 0,
      confidence_score: data.grading_summary?.confidence_score || 0
    });

    // Return the graded context to the frontend
    return NextResponse.json({
      relevant_context: data.relevant_context || [],
      grading_summary: data.grading_summary || {
        total_items: vector_search_results.length,
        relevant_items: 0,
        confidence_score: 0
      },
      metadata: {
        request_id: requestId,
        processing_time_ms: totalDuration
      }
    });

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[${requestId}] Context grading failed`, {
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