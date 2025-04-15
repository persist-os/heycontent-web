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

    // Extract user_id from token (first part before the first dot)
    const user_id = token.split('.')[0];

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
        error: errorData
      });
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    const totalDuration = Date.now() - startTime;

    console.info(`[${requestId}] Request completed successfully`, {
      duration_ms: totalDuration,
      analysis_success: data.success || false
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
    console.error(`[${requestId}] Request failed`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration_ms: totalDuration,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: false,
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      metadata: {
        request_id: requestId,
        processing_time_ms: totalDuration
      }
    }, { status: 500 });
  }
}
