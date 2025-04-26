import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.hicontent.co';

export async function POST(request: Request) {
  const requestId = `auth-key-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  try {
    // Get the request body
    const body = await request.json();
    const { idToken, action } = body;
    
    if (!idToken) {
      console.warn(`[${requestId}] Missing idToken in request`);
      return NextResponse.json({ error: 'ID Token is required' }, { status: 400 });
    }
    
    console.log(`[${requestId}] Proxying API key request to backend`);
    
    // Forward the request to the actual backend
    console.log(`[${requestId}] Making API key request to ${BACKEND_URL}/api/v1/api-keys/`);
    
    const response = await fetch(`${BACKEND_URL}/api/v1/api-keys/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        // The v1 API expects userId and doesn't need the action or idToken in the body
        // The idToken in the Authorization header is enough
        userId: body.userId
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText || 'Unknown error' };
      }
      
      console.error(`[${requestId}] Backend API error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        rawResponse: errorText.substring(0, 500) // Log first 500 chars in case it's a large response
      });
      
      // For debugging: pass through the full error details to the client
      return NextResponse.json(
        { 
          error: errorData.message || `Backend responded with status: ${response.status}`,
          details: errorData,
          status: response.status,
          requestId
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`[${requestId}] API key request successful`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[${requestId}] Error processing API key request:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
