import { NextResponse } from 'next/server';
import { authenticateRequest, type AuthResult, type AuthError } from '@/app/lib/api-helpers-server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Validate backend URL configuration
function validateBackendUrl(): string {
  if (!BACKEND_URL) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL environment variable is not configured');
  }
  if (!BACKEND_URL.startsWith('http://') && !BACKEND_URL.startsWith('https://')) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL must start with http:// or https://');
  }
  return BACKEND_URL;
}

// Validate request body structure
function validateRequestBody(body: any): { timeWindow: number; traceIds: string[]; minConfidence: number } {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be a valid JSON object');
  }

  const { timeWindow = 30, traceIds, minConfidence = 0.6 } = body;

  // Validate timeWindow
  if (typeof timeWindow !== 'number' || timeWindow <= 0) {
    throw new Error('timeWindow must be a positive number');
  }

  // Validate traceIds
  if (traceIds !== undefined) {
    if (!Array.isArray(traceIds)) {
      throw new Error('traceIds must be an array when provided');
    }
    if (!traceIds.every(id => typeof id === 'string' && id.length > 0)) {
      throw new Error('All traceIds must be non-empty strings');
    }
  }

  // Validate minConfidence
  if (typeof minConfidence !== 'number' || minConfidence < 0 || minConfidence > 1) {
    throw new Error('minConfidence must be a number between 0 and 1');
  }

  return {
    timeWindow,
    traceIds: traceIds || [],
    minConfidence
  };
}

// Validate backend response structure
function validateBackendResponse(data: any): any {
  if (!data || typeof data !== 'object') {
    throw new Error('Backend response is not a valid JSON object');
  }

  // Ensure insights is an array
  if (data.insights && !Array.isArray(data.insights)) {
    console.warn('Backend response insights is not an array, converting to array');
    data.insights = [];
  }

  // Ensure crystallization_metadata is an object
  if (data.crystallization_metadata && typeof data.crystallization_metadata !== 'object') {
    console.warn('Backend response crystallization_metadata is not an object, converting to object');
    data.crystallization_metadata = {};
  }

  // Ensure processing_time_ms is a number
  if (data.processing_time_ms && typeof data.processing_time_ms !== 'number') {
    console.warn('Backend response processing_time_ms is not a number, converting to 0');
    data.processing_time_ms = 0;
  }

  return data;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[${requestId}] Persona crystallization request started`, {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    headers: {
      'content-type': request.headers.get('Content-Type'),
      'user-agent': request.headers.get('User-Agent'),
      'authorization': request.headers.get('Authorization') ? '[REDACTED]' : 'missing'
    }
  });

  try {
    // Validate backend URL configuration
    const backendUrl = validateBackendUrl();
    console.debug(`[${requestId}] Backend URL validated: ${backendUrl}`);

    // Authenticate request
    console.debug(`[${requestId}] Authenticating request`);
    const authHeader = request.headers.get('Authorization');
    const authResult = authenticateRequest(authHeader);
    
    // Check if authentication failed
    if ('error' in authResult) {
      console.warn(`[${requestId}] ${authResult.error}`);
      return NextResponse.json(authResult, { status: 401 });
    }
    
    const { apiKey, userId } = authResult;
    console.debug(`[${requestId}] Authentication successful for user: ${userId}`);

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      const errorMsg = 'Invalid JSON in request body';
      console.error(`[${requestId}] ${errorMsg}`, parseError);
      return NextResponse.json({
        error: errorMsg,
        details: parseError instanceof Error ? parseError.message : 'Unable to parse JSON'
      }, { status: 400 });
    }

    const { timeWindow, traceIds, minConfidence } = validateRequestBody(body);
    console.debug(`[${requestId}] Request body validated`, {
      timeWindow,
      traceIdsCount: traceIds.length,
      minConfidence,
      traceIdsPreview: traceIds.slice(0, 3)
    });

    // Use authenticated user ID from API key
    const user_id = userId;

    console.debug(`[${requestId}] Starting insight crystallization`, {
      user_id: user_id,
      timeWindow,
      traceIdsCount: traceIds.length,
      minConfidence,
      apiKeyPresent: !!apiKey
    });

    // Prepare the request body for the backend
    const backendRequestBody = {
      user_id,
      trace_ids: traceIds,
      min_confidence: minConfidence,
      time_window_days: timeWindow
    };

    const backendEndpoint = `${backendUrl}/api/v1/persona-crystallization/crystallize-insights`;
    
    console.debug(`[${requestId}] Sending crystallization request to backend`, {
      endpoint: backendEndpoint,
      bodyStructure: {
        user_id: typeof backendRequestBody.user_id,
        trace_ids_count: backendRequestBody.trace_ids.length,
        min_confidence: backendRequestBody.min_confidence,
        time_window_days: backendRequestBody.time_window_days
      },
      requestHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': '[REDACTED]'
      }
    });

    // Call the backend crystallization endpoint
    const response = await fetch(backendEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(backendRequestBody)
    });

    const responseTime = Date.now() - startTime;
    console.debug(`[${requestId}] Backend response received`, {
      status: response.status,
      statusText: response.statusText,
      responseTime: responseTime,
      headers: {
        'content-type': response.headers.get('Content-Type'),
        'content-length': response.headers.get('Content-Length')
      }
    });

    if (!response.ok) {
      let errorText: string;
      let errorDetails: any = {};
      
      try {
        errorText = await response.text();
        // Try to parse as JSON for structured error details
        try {
          errorDetails = JSON.parse(errorText);
        } catch {
          // Not JSON, use as-is
        }
      } catch (readError) {
        errorText = `Failed to read error response: ${readError}`;
      }

      console.error(`[${requestId}] Backend crystallization failed`, {
        status: response.status,
        statusText: response.statusText,
        errorText,
        errorDetails,
        endpoint: backendEndpoint,
        responseTime
      });

      // Return simplified error messages based on status code
      let clientErrorMessage = 'Crystallization request failed';
      if (response.status === 401) {
        clientErrorMessage = 'Authentication failed';
      } else if (response.status === 400) {
        clientErrorMessage = 'Invalid request data';
      } else if (response.status === 404) {
        clientErrorMessage = 'Service endpoint not found';
      } else if (response.status >= 500) {
        clientErrorMessage = 'Service temporarily unavailable';
      }

      throw new Error(`${clientErrorMessage} (${response.status}): ${errorText}`);
    }

    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse backend response as JSON`, {
        parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        responseHeaders: Object.fromEntries(response.headers.entries())
      });
      throw new Error('Backend returned invalid JSON response');
    }

    // Validate and sanitize backend response
    const validatedData = validateBackendResponse(data);
    
    console.debug(`[${requestId}] Backend crystallization response validated`, {
      insightsCount: validatedData.insights?.length || 0,
      processingTime: validatedData.processing_time_ms || 0,
      hasMetadata: !!validatedData.crystallization_metadata,
      responseSize: JSON.stringify(validatedData).length,
      totalResponseTime: responseTime
    });

    const totalDuration = Date.now() - startTime;
    console.info(`[${requestId}] Crystallization completed successfully`, {
      duration_ms: totalDuration,
      insights_crystallized: validatedData.insights?.length || 0,
      backend_processing_time: validatedData.processing_time_ms || 0,
      total_request_time: totalDuration
    });

    // Return the crystallization result with validated data
    const responseData = {
      insights: validatedData.insights || [],
      crystallization_metadata: validatedData.crystallization_metadata || {},
      processing_time_ms: validatedData.processing_time_ms || totalDuration,
      metadata: {
        request_id: requestId,
        processing_time_ms: totalDuration,
        backend_endpoint: backendEndpoint,
        trace_ids_processed: traceIds.length
      }
    };

    console.debug(`[${requestId}] Returning crystallization response`, {
      responseSize: JSON.stringify(responseData).length,
      insightsCount: responseData.insights.length,
      hasMetadata: Object.keys(responseData.crystallization_metadata).length > 0
    });

    return NextResponse.json(responseData);
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Determine appropriate status code based on error type
    let statusCode = 500;
    let clientErrorMessage = 'Internal server error during crystallization';
    
    if (errorMessage.includes('NEXT_PUBLIC_BACKEND_URL')) {
      statusCode = 503;
      clientErrorMessage = 'Service configuration error';
    } else if (errorMessage.includes('Authentication failed') || errorMessage.includes('Unauthorized')) {
      statusCode = 401;
      clientErrorMessage = 'Authentication failed';
    } else if (errorMessage.includes('Request body') || errorMessage.includes('must be')) {
      statusCode = 400;
      clientErrorMessage = 'Invalid request data';
    } else if (errorMessage.includes('endpoint not found')) {
      statusCode = 502;
      clientErrorMessage = 'Service endpoint not available';
    } else if (errorMessage.includes('temporarily unavailable')) {
      statusCode = 503;
      clientErrorMessage = 'Service temporarily unavailable';
    }

    console.error(`[${requestId}] Crystallization failed`, {
      error: errorMessage,
      errorType: error?.constructor?.name || 'Unknown',
      stack: errorStack,
      duration_ms: totalDuration,
      timestamp: new Date().toISOString(),
      statusCode,
      backendUrl: BACKEND_URL || 'not configured'
    });

    // Return structured error response with fallback data
    const errorResponse = {
      insights: [],
      crystallization_metadata: { 
        error: clientErrorMessage,
        request_id: requestId
      },
      processing_time_ms: 0,
      metadata: {
        request_id: requestId,
        processing_time_ms: totalDuration,
        error: true
      }
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
