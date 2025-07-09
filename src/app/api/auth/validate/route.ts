import { NextResponse } from 'next/server';
import { extractApiKeyFromHeader } from '@/app/lib/api-helpers-server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function GET(request: Request) {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    const apiKey = extractApiKeyFromHeader(authHeader);
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
    }

    // Call backend validation endpoint
    const response = await fetch(`${BACKEND_URL}/api/v1/api-keys/validate`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.status === 401) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    if (!response.ok) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ valid: true, data });
  } catch (error) {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API validation error:', error);
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 