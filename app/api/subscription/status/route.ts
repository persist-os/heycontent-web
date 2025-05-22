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
      // Helper function to get plan name from plan type
      function getPlanName(planType: string): string {
        switch (planType) {
          case 'monthly_basic':
            return 'Basic Monthly';
          case 'monthly_pro':
            return 'Pro Monthly';
          case 'yearly_basic':
            return 'Basic Yearly';
          case 'yearly_pro':
            return 'Pro Yearly';
        }
      }
      
      // Try to get the status from the backend
      try {
        const backendStatus = await getSubscriptionStatus(apiKey, userId);
        
        // Handle the backend response as a generic object
        const backendData = backendStatus as any;
        
        // Map backend response to frontend SubscriptionStatus interface
        const frontendStatus = {
          success: true,
          is_subscribed: backendData.status === 'active' || backendData.status === 'trialing',
          plan_type: backendData.plan_type,
          plan_name: getPlanName(backendData.plan_type),
          current_period_end: backendData.current_period_end,
          cancel_at_period_end: backendData.cancel_at_period_end || false,
          usage: {
            used: 0, // Default values, update if available in backend response
            limit: 100,
            remaining: 100,
            reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
          }
        };
        
        console.log(`[${requestId}] Subscription status request completed`, {
          timestamp: new Date().toISOString(),
          userId,
          isSubscribed: frontendStatus.is_subscribed,
          planType: frontendStatus.plan_type
        });
        
        return NextResponse.json(frontendStatus);
      } catch (apiError) {
        // Check if this is a validation error
        const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error';
        console.error(`[${requestId}] Failed to get subscription status`, { error: errorMessage });
        
        // If it contains validation errors, try to get the raw response
        if (errorMessage.includes('validation') || errorMessage.includes('ResponseValidationError')) {
          try {
            // Make a direct fetch to get the raw response without validation
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            const response = await fetch(`${backendUrl}/api/v1/subscription/status/${userId}`, {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              throw new Error(`Backend returned ${response.status}`);
            }
            
            // Get the raw data
            const rawData = await response.json();
            
            // Map any non-standard values to standard ones
            const mappedData = {
              ...rawData,
              // Map 'inactive' to 'canceled', 'free' to 'monthly_basic'
              status: rawData.status === 'inactive' ? 'canceled' : rawData.status,
              plan_type: rawData.plan_type === 'free' ? 'monthly_basic' : rawData.plan_type
            };
            
            console.log(`[${requestId}] Mapped subscription status`, {
              original: rawData,
              mapped: mappedData
            });
            
            return NextResponse.json(mappedData);
          } catch (fetchError) {
            console.error(`[${requestId}] Failed to fetch raw subscription status`, {
              error: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
            });
          }
        }
        
        // Fallback response
        return NextResponse.json(
          { 
            success: false,
            error: errorMessage,
            is_subscribed: false,
            status: 'canceled',
            plan_type: 'monthly_basic'
          },
          { status: 200 } // Return 200 to the frontend even though there was an error
        );
      }
    } catch (error) {
      console.error(`[${requestId}] Subscription status request failed`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Fallback response
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to process subscription status',
          is_subscribed: false,
          status: 'canceled',
          plan_type: 'monthly_basic'
        },
        { status: 200 } // Return 200 to the frontend
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
