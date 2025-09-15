import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function GET(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[${requestId}] Persona health check request started`, {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  });

  try {
    // Get API key from Authorization header (optional for health check)
    const authHeader = request.headers.get('Authorization');
    const { apiKey } = extractAuthInfo(authHeader);

    console.debug(`[${requestId}] Checking Agent 1 backend health`);

    // Call the backend health check endpoint
    const response = await fetch(`${BACKEND_URL}/api/v1/persona/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
      }
    });

    const responseTime = Date.now() - startTime;

    console.debug(`[${requestId}] Backend response status`, response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`Health check failed (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    
    console.info(`[${requestId}] Health check completed successfully`, {
      duration_ms: responseTime,
      backend_healthy: true,
      version: data.version
    });

    // Return the health check result
    const responseData = {
      healthy: true,
      responseTime,
      version: data.version,
      metadata: {
        request_id: requestId,
        processing_time_ms: responseTime
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[${requestId}] Health check failed`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: responseTime,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      healthy: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        request_id: requestId,
        processing_time_ms: responseTime
      }
    });
  }
}
