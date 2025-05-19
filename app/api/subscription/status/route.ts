import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';
import { getSubscriptionStatus } from '@/app/lib/subscription-api';

/**
 * GET handler for subscription status
 * 
 * This endpoint retrieves the current subscription status for a user.
 * It requires an Authorization header with a valid API key.
 */
export async function GET(request: Request) {
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] Subscription status request started`, {
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

    // Get subscription status using our API utility
    try {
      const status = await getSubscriptionStatus(apiKey, userId);
      
      console.log(`[${requestId}] Subscription status request completed`, {
        timestamp: new Date().toISOString(),
        userId,
        isSubscribed: status.is_subscribed,
        planType: status.plan_type
      });
      
      return NextResponse.json(status);
    } catch (apiError) {
      console.error(`[${requestId}] Failed to get subscription status`, {
        error: apiError instanceof Error ? apiError.message : 'Unknown API error'
      });
      
      return NextResponse.json(
        { 
          error: apiError instanceof Error ? apiError.message : 'Failed to get subscription status',
          is_subscribed: false,
          plan_type: 'none'
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] Subscription status request failed`, {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to get subscription status',
        is_subscribed: false,
        plan_type: 'none'
      },
      { status: 500 }
    );
  }
}
