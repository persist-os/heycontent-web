import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/app/lib/firebaseAdmin'; // adjust path as needed

export async function POST(req: NextRequest) {
  try {
    const { threadId, emailId } = await req.json();
    if (!threadId || !emailId) {
      return NextResponse.json({ status: 'error', error: 'Missing threadId or emailId' }, { status: 400 });
    }

    // Get the user's auth token from cookies or headers
    const token = req.cookies.get('auth_token')?.value || req.headers.get('authorization');
    if (!token) {
      return NextResponse.json({ status: 'error', error: 'Not authenticated' }, { status: 401 });
    }

    // Verify the Firebase token and extract userId
    const decoded = await admin.auth().verifyIdToken(token.replace(/^Bearer /, ''));
    const userId = decoded.uid;

    // Call the backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${backendUrl}/api/v1/gmail/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userId, thread_id: threadId, email_id: emailId }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 