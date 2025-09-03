import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

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
      // This endpoint is only used for summary in our current flow; keep POST path for compatibility
      // but do not report usage here.
      const result = { success: true } as any;
      
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
          error: isRateLimit 
            ? 'Whoa there! You\'re creating at lightning speed! Take a quick break and try again in a moment.' 
            : 'We hit a small snag while recording your usage. Your creative work is safe!',
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
        error: 'We couldn\'t record your usage right now. Don\'t worry, your creative work is still being processed. Try again in a moment!'
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
    const { userId } = extractAuthInfo(authHeader);

    if (!userId) {
      console.warn(`[${requestId}] Authentication failed: No Authorization header or invalid format`);
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid Authorization header' }, 
        { status: 401 }
      );
    }

    // Get URL parameters
    const url = new URL(request.url);
    const meterName = url.searchParams.get('meterName') || 'api_requests';

    try {
      // Call Convex HTTP route directly for summary to avoid backend dependency
      const convexUrl = `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/users/${userId}/usage/summary`;
      const resp = await fetch(convexUrl, { method: 'GET' });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Convex usage summary failed: ${resp.status} ${text}`);
      }
      const summary = await resp.json();
      // Expect keys: { success, total, included, overage }
      const total = Number(summary.total || summary.total_usage || 0);
      const included = Number(summary.included || 0);
      if (included && total >= included) {
        const overJson = {
          error: "Free tier limit reached. Please upgrade to continue.",
          code: "FREE_LIMIT_EXCEEDED",
          included,
          used: total,
        };
        const res = NextResponse.json(overJson, { status: 402 });
        res.headers.set('X-Free-Tier-Limit', String(included));
        res.headers.set('X-Free-Tier-Used', String(total));
        return res;
      }
      return NextResponse.json({ success: true, total, included, overage: Math.max(0, total - included) });
    } catch (apiError) {
      console.error(`[${requestId}] Failed to get usage summary (convex)`, {
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
