import { NextRequest, NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';
import { createFreeTierSubscription } from '@/app/lib/subscription-api';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[${requestId}] Free tier subscription request started`, {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  });

  try {
    // Auth
    const authHeader = request.headers.get('Authorization');
    const { apiKey, userId: authUserId } = extractAuthInfo(authHeader);

    if (!apiKey) {
      console.warn(`[${requestId}] Authentication failed: No Authorization header or invalid format`);
      return NextResponse.json({ error: 'We need to verify your account to continue. Please sign in to unlock your creative potential!' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const userId = body.userId || authUserId;
    const email = body.email || '';
    const name = body.name || '';

    // Validate required fields
    if (!userId || !email || !name) {
      console.error(`[${requestId}] Invalid free tier request: missing required fields`);
      return NextResponse.json(
        { error: 'A few details are missing to get you started. Please check your information and try again!' },
        { status: 400 }
      );
    }

    // Call API utility to create free tier subscription
    try {
      const result = await createFreeTierSubscription(
        apiKey,
        userId,
        email,
        name
      );

      // Success
      console.log(`[${requestId}] Free tier subscription created successfully`, {
        timestamp: new Date().toISOString(),
        userId,
        customerId: result.data?.customer_id,
        subscriptionId: result.data?.subscription_id
      });

      return NextResponse.json({
        success: true,
        message: 'Free tier subscription created successfully',
        data: result.data
      });
    } catch (apiError) {
      console.error(`[${requestId}] Free tier subscription creation failed`, {
        error: apiError instanceof Error ? apiError.message : 'Unknown API error'
      });
      
      return NextResponse.json(
        { error: apiError instanceof Error ? 
          apiError.message : 
          'We hit a snag while setting up your free tier. Our team is on it! Try again in a moment.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] Free tier subscription request failed`, {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      { error: 'We\'re having trouble processing your free tier subscription right now. Don\'t worry, your creative work is safe! Please try again in a few minutes.' },
      { status: 500 }
    );
  } finally {
    console.log(`[${requestId}] Free tier subscription request finished`, {
      duration: Date.now() - startTime
    });
  }
}
