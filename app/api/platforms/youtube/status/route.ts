import { NextResponse } from 'next/server';
import { getServerSession } from '@/app/lib/server-auth';

export async function GET() {
  console.log('YouTube status route called');
  try {
    console.log('Getting server session...');
    const session = await getServerSession();
    console.log('Session result:', session ? 'Session found' : 'No session found');

    if (!session?.user?.id) {
      console.log('No user ID in session, returning 401');
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'No valid session found. Please log in again.',
        code: 'SESSION_MISSING'
      }, { status: 401 });
    }

    console.log('User authenticated:', session.user.id);

    // Proxy request to FastAPI backend
    try {
      const backendRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/youtube/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: session.user.id }),
      });

      const data = await backendRes.json();
      return NextResponse.json(data, { status: backendRes.status });
    } catch (backendErr) {
      console.error('Error communicating with FastAPI backend:', backendErr);
      return NextResponse.json({
        error: 'Failed to contact backend',
        details: backendErr instanceof Error ? backendErr.message : backendErr
      }, { status: 502 });
    }
  } catch (err) {
    console.error('Error in YouTube status route:', err);
    return NextResponse.json({
      error: 'Failed to contact backend',
      details: err instanceof Error ? err.message : err
    }, { status: 500 });
  }
}