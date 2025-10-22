import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

/**
 * POST /api/convergence/optimize
 * 
 * Admin-only endpoint to trigger Convergence optimization runs.
 * Thin proxy to backend - triggers background job and returns immediately.
 * 
 * Backend writes results to Convex automatically.
 * Frontend Convex queries update reactively when new data appears.
 */
export async function POST(request: NextRequest) {
  console.log('[convergence-optimize] Optimization request received');
  
  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('Authorization') || '';
    const bearerPrefix = 'Bearer ';
    const apiKey = authHeader.startsWith(bearerPrefix)
      ? authHeader.slice(bearerPrefix.length).trim()
      : '';

    if (!apiKey) {
      console.warn('[convergence-optimize] Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    console.log('[convergence-optimize] Received request:', {
      system_name: body.system_name,
      algorithm: body.algorithm,
      generations: body.generations,
      backend_url: BACKEND_URL,
      timestamp: new Date().toISOString()
    });

    // Forward to backend convergence endpoint
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/v1/convergence/optimize`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      }
    );

    console.log('[convergence-optimize] Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('[convergence-optimize] Backend error:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        errorText
      });
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { 
          detail: errorText || `Backend responded with ${backendResponse.status}: ${backendResponse.statusText}` 
        };
      }
      
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const responseData = await backendResponse.json();
    
    console.log('[convergence-optimize] Backend response:', {
      success: responseData.success,
      job_id: responseData.job_id,
      message_length: responseData.message?.length || 0
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[convergence-optimize] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Internal server error occurred',
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

