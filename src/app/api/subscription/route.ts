import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';
import { createCheckoutSession } from '@/app/lib/subscription-api';
import dotenv from 'dotenv';

dotenv.config();

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[${requestId}] Subscription request started`, {
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
    const planId = body.planId;
    // Validate required fields
    if (!userId || !planId || !email || !name) {
      console.error(`[${requestId}] Invalid subscription request: missing required fields`);
      return NextResponse.json(
        { error: 'A few details are missing to get you started. Please check your information and try again!' },
        { status: 400 }
      );
    }

    // Call API utility to create a checkout session
    try {
      const session = await createCheckoutSession(
        apiKey,
        userId,
        email,
        name,
        planId,
        body.returnUrl
      );

      // Success
      console.log(`[${requestId}] Subscription request completed`, {
        timestamp: new Date().toISOString(),
        userId,
        planId,
        session
      });

      return NextResponse.json(session);
    } catch (apiError) {
      console.error(`[${requestId}] Checkout session creation failed`, {
        error: apiError instanceof Error ? apiError.message : 'Unknown API error'
      });
      
      return NextResponse.json(
        { error: apiError instanceof Error ? 
          apiError.message : 
          'We hit a snag while setting up your subscription. Our team is on it! Try again in a moment.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] Subscription request failed`, {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      { error: 'We\'re having trouble processing your subscription right now. Don\'t worry, your creative work is safe! Please try again in a few minutes.' },
      { status: 500 }
    );
  } finally {
    console.log(`[${requestId}] Subscription request finished`, {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    });
  }
}