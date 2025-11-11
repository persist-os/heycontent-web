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
        { error: 'We need to confirm your account details to continue. Please sign in again to access your subscription.' }, 
        { status: 401 }
      );
    }

    // Get subscription status using our API utility
    try {
      // Helper function to get plan name from plan type
      function getPlanName(planType: string): string {
        switch (planType) {
          case 'monthly_free':
            return 'Free Monthly';
          case 'monthly_basic':
            return 'Basic Monthly';
          case 'monthly_pro':
            return 'Pro Monthly';
          case 'yearly_basic':
            return 'Basic Yearly';
          case 'yearly_pro':
            return 'Pro Yearly';
          default:
            return planType; // Fallback to plan_type if unknown
        }
      }
      
      // Try to get the status from the backend
      try {
        const backendStatus = await getSubscriptionStatus(apiKey, userId);
        
        // Handle the backend response as a generic object
        const backendData = backendStatus as any;
        
        // If subscription field is missing, assume monthly_free
        const planType = backendData.plan_type || 'monthly_free';
        
        // Map backend response to frontend SubscriptionStatus interface
        const frontendStatus = {
          success: true,
          is_subscribed: backendData.status === 'active' || backendData.status === 'trialing' || planType === 'monthly_free',
          plan_type: planType,
          plan_name: getPlanName(planType),
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
        console.error(`[${requestId}] Could not fetch subscription details`, { error: errorMessage });
        
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
          
            // Get raw data
            const rawData = await response.json();
            
            // Map any non-standard values to standard ones
            const mappedData = {
              ...rawData,
              // Map 'inactive' to 'canceled', 'free' to 'monthly_basic'
              status: rawData.status === 'inactive' ? 'canceled' : rawData.status,
              plan_type: rawData.plan_type === 'monthly_basic' ? 'monthly_basic' : rawData.plan_type
            };
            
            console.log(`[${requestId}] Mapped subscription status`, {
              original: rawData,
              mapped: mappedData
            });
            
            return NextResponse.json(mappedData);
          } catch (fetchError) {
            console.error(`[${requestId}] Failed to fetch raw subscription status`, {
              error: fetchError instanceof Error ? `We're having trouble connecting to our servers. Please try again in a moment.` : 'Our systems are taking longer than usual to respond. Your creative flow is important to us!'
            });
          }
        }
        
        // Fallback response - assume monthly_free if subscription field is missing
        return NextResponse.json(
          { 
            success: false,
            error: 'We hit a small snag while checking your subscription. Your creative work is safe, and we\'re on it!',
            is_subscribed: true,
            status: 'active',
            plan_type: 'monthly_free',
            plan_name: 'Free Monthly'
          },
          { status: 200 } // Return 200 to the frontend even though there was an error
        );
      }
    } catch (error) {
      console.error(`[${requestId}] Subscription status request failed`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Fallback response - assume monthly_free if subscription field is missing
      return NextResponse.json(
        { 
          success: false,
error: 'We\'re having a bit of trouble checking your subscription details. Your creative work is safe, and we\'re on it!',
          is_subscribed: true,
          status: 'active',
          plan_type: 'monthly_free',
          plan_name: 'Free Monthly'
        },
        { status: 200 } // Return 200 to the frontend
      );
    }
  } catch (error) {
    console.error(`[${requestId}] Subscription status request failed`, {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Assume monthly_free if subscription field is missing
    return NextResponse.json(
      { 
        error: 'We couldn\'t load your subscription details right now. Don\'t worry, your creative work is safe! Try refreshing the page or check back in a few minutes.',
        is_subscribed: true,
        status: 'active',
        plan_type: 'monthly_free',
        plan_name: 'Free Monthly'
      },
      { status: 200 } // Return 200 to avoid breaking UI
    );
  }
}
