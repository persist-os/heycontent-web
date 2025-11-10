/**
 * Admin API Route: Direct Cognitive Field Generation
 * 
 * Proxies requests to backend endpoint for direct 4-layer cognitive field generation.
 * No background jobs - direct execution with immediate feedback.
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get API key from headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Missing Authorization header' },
        { status: 401 }
      );
    }
    
    // Forward to backend
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/v1/intelligence/admin/generate-cognitive-field`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify(body),
      }
    );
    
    const data = await backendResponse.json();
    
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error: any) {
    console.error('[API] Cognitive field generation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to generate cognitive field',
      },
      { status: 500 }
    );
  }
}

