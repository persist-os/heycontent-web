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
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
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
        { error: 'Missing required fields' },
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
        { error: apiError instanceof Error ? apiError.message : 'Failed to create checkout session' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] Subscription request failed`, {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  } finally {
    console.log(`[${requestId}] Subscription request finished`, {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    });
  }
}