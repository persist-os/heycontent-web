import { NextRequest, NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.hicontent.co';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const authHeader = request.headers.get('Authorization');
    const { apiKey } = extractAuthInfo(authHeader);

    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Forward to backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/projects/${projectId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.error || 'Backend request failed' }, 
        { status: backendResponse.status }
      );
    }
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[API Route Error] /api/projects/[projectId]/status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

