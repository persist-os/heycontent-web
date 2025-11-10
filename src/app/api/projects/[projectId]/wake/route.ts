import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Wake sleeping project
 * 
 * Resets budget and resumes widget execution
 */
export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const { apiKey } = extractAuthInfo(authHeader);

    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.projectId;
    
    // Call backend to wake project
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/v1/projects/${projectId}/wake`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to wake project' }, 
        { status: backendResponse.status }
      );
    }
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[API Route Error] /api/projects/[projectId]/wake:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

