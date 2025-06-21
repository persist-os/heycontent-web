import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function GET(
  request: Request,
  { params }: { params: { note_type: string } }
) {
  const requestId = Math.random().toString(36).substring(7);
  const { note_type } = await params;

  console.log(`[${requestId}] Agent info request for type: ${note_type}`, {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  });

  try {
    // Call the backend agent-info endpoint
    const backendUrl = `${BACKEND_URL}/api/v1/smart-note-typed/agent-info/${note_type}`;
    console.info(`[${requestId}] Sending request to backend API`, {
      url: backendUrl,
      note_type
    });

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`[${requestId}] Backend API error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: backendUrl
      });
      return NextResponse.json({ 
        error: errorData?.error || errorData?.detail || 'Backend error',
        details: errorData 
      }, { status: response.status });
    }

    const data = await response.json();

    console.info(`[${requestId}] Request completed successfully`, {
      note_type,
      agent_name: data.data?.agent_name
    });

    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${requestId}] Request failed:`, {
      error: errorMessage,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to get agent info',
      message: errorMessage,
      metadata: {
        request_id: requestId,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
} 