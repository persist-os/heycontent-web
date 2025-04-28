import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = 'https://backend.hicontent.co';

// Helper function to extract core idea and format it as a title
function extractCoreIdeaAsTitle(coreIdea: string): string {
  if (!coreIdea) return '';

  // Format the core idea as a title
  // Remove any trailing periods, make first letter uppercase
  let title = coreIdea.trim();
  if (title.endsWith('.')) {
    title = title.slice(0, -1);
  }

  // Capitalize first letter of each word for title case
  return title.replace(/\b\w/g, c => c.toUpperCase());
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[${requestId}] Smart note analysis request started`, {
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
    const { content_note } = body;

    if (!content_note) {
      console.warn(`[${requestId}] Invalid request: Missing content_note`);
      return NextResponse.json({ error: 'Content note is required' }, { status: 400 });
    }

    // Log the request details
    console.info(`[${requestId}] Processing smart note analysis`, {
      content_length: content_note?.length,
      has_token: !!token
    });

    // Log the token format for debugging (first 10 chars only for security)
    console.info(`[${requestId}] Using token format:`, {
      tokenPrefix: token.substring(0, 10) + '...',
      tokenLength: token.length
    });

    // Log the request to the backend
    console.info(`[${requestId}] Sending request to backend API`, {
      url: `${BACKEND_URL}/api/v1/smart-note/analyze`,
      contentLength: content_note?.length || 0
    });

    const response = await fetch(`${BACKEND_URL}/api/v1/smart-note/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content_note
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`[${requestId}] Backend API error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: `${BACKEND_URL}/api/v1/smart-note/analyze`
      });
      throw new Error(`Backend API responded with status: ${response.status} (${response.statusText})`);
    }

    const data = await response.json();
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
      analysis_success: data.success || false,
      has_data: !!data.data,
      has_analysis: !!(data.data && data.data.analysis),
      response_size: JSON.stringify(data).length
    });

    // Extract core idea if available
    let suggestedTitle = '';
    if (data.success && data.data?.analysis?.contentStrategy?.overview?.coreIdea) {
      const coreIdea = data.data.analysis.contentStrategy.overview.coreIdea;
      suggestedTitle = extractCoreIdeaAsTitle(coreIdea);

      console.info(`[${requestId}] Extracted core idea as title: ${suggestedTitle}`);

      // Add the suggested title to the response
      data.suggestedTitle = suggestedTitle;
    }

    // Return the response data with the suggested title
    return NextResponse.json(data);
  } catch (error) {
    const totalDuration = Date.now() - startTime;

    // Get detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'UnknownError';

    console.error(`[${requestId}] Request failed: ${errorName}`, {
      error: errorMessage,
      stack: errorStack,
      duration_ms: totalDuration,
      timestamp: new Date().toISOString()
    });

    // Return a more detailed error response
    return NextResponse.json({
      success: false,
      error: 'Analysis Failed',
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
