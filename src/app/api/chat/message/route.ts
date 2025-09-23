import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    // Get API key and user ID from Authorization header
    const authHeader = request.headers.get('Authorization');
    const { apiKey, userId } = extractAuthInfo(authHeader);
    
    if (!apiKey) {
      console.warn(`[${requestId}] Authentication failed`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    console.log(`[${requestId}] Forwarding request to backend`);

    // Forward request to backend with minimal processing
    const response = await fetch(`${BACKEND_URL}/api/v1/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error(`[${requestId}] Backend error:`, response.status, response.statusText);
      return NextResponse.json(
        { error: 'Backend service error' }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[${requestId}] Request completed successfully`);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error(`[${requestId}] Request failed:`, error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}