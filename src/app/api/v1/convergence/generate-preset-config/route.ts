import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

/**
 * POST /api/v1/convergence/generate-preset-config
 * 
 * Admin-only endpoint to generate Convergence configs from presets.
 * Thin proxy to backend - generates config and returns immediately.
 * 
 * Backend saves generated config to Convex automatically.
 * Frontend Convex queries update reactively when new data appears.
 */
export async function POST(request: NextRequest) {
  console.log('[convergence-generate-preset-config] Preset config generation request received');
  
  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('Authorization') || '';
    const bearerPrefix = 'Bearer ';
    const apiKey = authHeader.startsWith(bearerPrefix)
      ? authHeader.slice(bearerPrefix.length).trim()
      : '';

    if (!apiKey) {
      console.warn('[convergence-generate-preset-config] Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    console.log('[convergence-generate-preset-config] Received request:', {
      system_name: body.system_name,
      preset_id: body.preset_id,
      backend_url: BACKEND_URL,
      timestamp: new Date().toISOString()
    });

    // Forward to backend convergence preset config generation endpoint
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/v1/convergence/generate-preset-config`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      }
    );

    console.log('[convergence-generate-preset-config] Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('[convergence-generate-preset-config] Backend error:', {
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
    
    console.log('[convergence-generate-preset-config] Backend response:', {
      success: responseData.success,
      config_id: responseData.config_id,
      config_preview: responseData.config_preview ? 'present' : 'missing'
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[convergence-generate-preset-config] Error:', error);
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
