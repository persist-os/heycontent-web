import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';
import { getSubscriptionPlans } from '@/app/lib/subscription-api';

/**
 * GET handler for subscription plans
 * 
 * This endpoint retrieves all available subscription plans.
 * It requires an Authorization header with a valid API key.
 */
export async function GET(request: Request) {
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] Subscription plans request started`, {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  });

  try {
    // Auth
    const authHeader = request.headers.get('Authorization');
    const { apiKey } = extractAuthInfo(authHeader);

    if (!apiKey) {
      console.warn(`[${requestId}] Authentication failed: No Authorization header or invalid format`);
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid Authorization header' }, 
        { status: 401 }
      );
    }

    // Get subscription plans using API utility
    try {
      const plans = await getSubscriptionPlans(apiKey);
      
      console.log(`[${requestId}] Subscription plans request completed`, {
        timestamp: new Date().toISOString(),
        planCount: Object.keys(plans).length
      });
      
      return NextResponse.json(plans);
    } catch (apiError) {
      console.error(`[${requestId}] Failed to get subscription plans`, {
        error: apiError instanceof Error ? apiError.message : 'Unknown API error'
      });
      
      return NextResponse.json(
        { error: apiError instanceof Error ? apiError.message : 'Failed to get subscription plans' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] Subscription plans request failed`, {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { error: 'Failed to get subscription plans' },
      { status: 500 }
    );
  }
}
