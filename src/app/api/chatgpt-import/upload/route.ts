import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = authHeader.substring(7);
    
    // Get the form data with file
    const formData = await request.formData();
    
    // CRITICAL: Validate backend URL exists
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!BACKEND_URL) {
      console.error('[chatgpt-import/upload] CRITICAL: NEXT_PUBLIC_BACKEND_URL not set in environment!');
      return NextResponse.json(
        { 
          error: 'Configuration error', 
          detail: 'Backend URL not configured. Please contact support or check deployment settings.' 
        }, 
        { status: 500 }
      );
    }

    const backendEndpoint = `${BACKEND_URL}/api/v1/chatgpt/upload`;
    
    // Log for debugging (helps diagnose production issues)
    console.log('[chatgpt-import/upload] Forwarding request to backend:', backendEndpoint);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    try {
      // Forward to backend
      const response = await fetch(backendEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[chatgpt-import/upload] Backend returned error:', {
          status: response.status,
          error
        });
        return NextResponse.json(error, { status: response.status });
      }

      const data = await response.json();
      console.log('[chatgpt-import/upload] Upload successful, job_id:', data.import_id || data.job_id);
      return NextResponse.json(data);

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Provide specific error messages for different failure types
      if (fetchError.name === 'AbortError') {
        console.error('[chatgpt-import/upload] Request timeout after 60s');
        return NextResponse.json(
          { 
            error: 'Request timeout', 
            detail: 'Backend took too long to respond. Please try again or upload a smaller file.' 
          }, 
          { status: 504 }
        );
      }
      
      // Network/connection errors
      if (fetchError instanceof TypeError) {
        console.error('[chatgpt-import/upload] Network error connecting to backend:', {
          message: fetchError.message,
          backendUrl: BACKEND_URL
        });
        return NextResponse.json(
          { 
            error: 'Backend connection failed', 
            detail: `Could not reach backend service at ${BACKEND_URL}. Please try again later or contact support.` 
          }, 
          { status: 502 }
        );
      }
      
      // Unknown fetch errors
      console.error('[chatgpt-import/upload] Fetch error:', fetchError);
      return NextResponse.json(
        { 
          error: 'Backend request failed', 
          detail: fetchError.message || 'Unknown error occurred while contacting backend service.' 
        }, 
        { status: 502 }
      );
    }

  } catch (error: any) {
    console.error('[chatgpt-import/upload] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        detail: error.message || String(error)
      },
      { status: 500 }
    );
  }
}

