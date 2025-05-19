import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';
import { reportUsage, getUsageSummary } from '@/app/lib/subscription-api';

/**
 * POST handler for reporting usage
 * 
 * This endpoint reports usage for a user's subscription.
 * It requires an Authorization header with a valid API key.
 */
export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] Usage reporting request started`, {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  });

  try {
    // Auth
    const authHeader = request.headers.get('Authorization');
    const { apiKey, userId } = extractAuthInfo(authHeader);

    if (!apiKey || !userId) {
      console.warn(`[${requestId}] Authentication failed: No Authorization header or invalid format`);
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid Authorization header' }, 
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const quantity = body.quantity || 1;
    const meterName = body.meterName || 'api_requests';

    // Report usage using our API utility
    try {
      const result = await reportUsage(apiKey, userId, quantity, meterName);
      
      console.log(`[${requestId}] Usage reporting request completed`, {
        timestamp: new Date().toISOString(),
        userId,
        quantity,
        meterName
      });
      
      return NextResponse.json(result);
    } catch (apiError) {
      // Check if this is a rate limit error
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error';
      const isRateLimit = errorMessage.includes('Rate limit exceeded');
      
      console.error(`[${requestId}] Failed to report usage`, {
        error: errorMessage,
        isRateLimit
      });
      
      return NextResponse.json(
        { 
          success: false,
          error: errorMessage,
          rate_limited: isRateLimit
        },
        { status: isRateLimit ? 429 : 400 }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] Usage reporting request failed`, {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to report usage'
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for retrieving usage summary
 * 
 * This endpoint retrieves the usage summary for a user.
 * It requires an Authorization header with a valid API key.
 */
export async function GET(request: Request) {
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] Usage summary request started`, {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  });

  try {
    // Auth
    const authHeader = request.headers.get('Authorization');
    const { apiKey, userId } = extractAuthInfo(authHeader);

    if (!apiKey || !userId) {
      console.warn(`[${requestId}] Authentication failed: No Authorization header or invalid format`);
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid Authorization header' }, 
        { status: 401 }
      );
    }

    // Get URL parameters
    const url = new URL(request.url);
    const meterName = url.searchParams.get('meterName') || 'api_requests';

    // Get usage summary using our API utility
    try {
      const summary = await getUsageSummary(apiKey, userId, meterName);
      
      console.log(`[${requestId}] Usage summary request completed`, {
        timestamp: new Date().toISOString(),
        userId,
        meterName,
        totalUsage: summary.total_usage
      });
      
      return NextResponse.json(summary);
    } catch (apiError) {
      console.error(`[${requestId}] Failed to get usage summary`, {
        error: apiError instanceof Error ? apiError.message : 'Unknown API error'
      });
      
      return NextResponse.json(
        { 
          success: false,
          error: apiError instanceof Error ? apiError.message : 'Failed to get usage summary',
          total_usage: 0,
          usage_records: []
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] Usage summary request failed`, {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get usage summary',
        total_usage: 0,
        usage_records: []
      },
      { status: 500 }
    );
  }
}
