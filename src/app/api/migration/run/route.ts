import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  console.log('[migration-run-api] Simple migration request received');
  
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[migration-run-api] Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = authHeader.substring(7);
    
    console.log('[migration-run-api] Calling backend migration endpoint');

    // Forward the request to the backend simple migration endpoint
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/migration/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({}), // Empty body - user ID comes from auth
    });

    console.log('[migration-run-api] Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('[migration-run-api] Backend error:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        errorText
      });
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText || `Backend responded with ${backendResponse.status}: ${backendResponse.statusText}` };
      }
      
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const responseData = await backendResponse.json();
    
    console.log('[migration-run-api] Backend response:', {
      success: responseData.success,
      items_added: responseData.items_added,
      shards_created: responseData.shards_created,
      crystals_created: responseData.crystals_created,
      message: responseData.message
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[migration-run-api] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        items_added: 0,
        shards_created: 0,
        crystals_created: 0,
        message: 'Internal server error occurred',
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
