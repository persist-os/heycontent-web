import { NextRequest, NextResponse } from 'next/server';

function isValidAnalysisResponse(data: any): boolean {
  // Example: expects { status: 'success', analysis: ... }
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.status === 'string' &&
    data.status === 'success' &&
    'analysis' in data
  );
}

export async function POST(req: NextRequest) {
  try {
    const { emailId, threadId } = await req.json();
    // Explicitly check that both are strings and not empty
    if (
      typeof emailId !== 'string' || emailId.trim().length === 0 ||
      typeof threadId !== 'string' || threadId.trim().length === 0
    ) {
      return NextResponse.json({ status: 'error', error: 'emailId and threadId must be non-empty strings' }, { status: 400 });
    }

    // Get the user's auth token from cookies or headers
    const token = req.cookies.get('auth_token')?.value || req.headers.get('authorization');
    if (!token) {
      return NextResponse.json({ status: 'error', error: 'Not authenticated' }, { status: 401 });
    }

    // Call the backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.hicontent.co';
    const response = await fetch(`${backendUrl}/api/v1/gmail/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      },
      body: JSON.stringify({ email_id: emailId, thread_id: threadId }),
    });

    const data = await response.json();
    if (!isValidAnalysisResponse(data)) {
      return NextResponse.json({ status: 'error', error: 'Failed to analyze Gmail thread. Please try again later.' }, { status: 502 });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    // Only send user-friendly error information
    return NextResponse.json({ status: 'error', error: 'An unexpected error occurred. Please try again later.' }, { status: 500 });
  }
} 