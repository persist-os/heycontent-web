import { NextRequest, NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

export async function POST(req: NextRequest) {
  try {
    const { user_id, instagram_account_id } = await req.json();
    if (!user_id || !instagram_account_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing user_id or instagram_account_id.' 
      }, { status: 400 });
    }

    // Extract API key and user ID from Authorization header
    const authHeader = req.headers.get('Authorization');
    const { apiKey, userId: extractedUserId } = extractAuthInfo(authHeader);

    if (!apiKey || !extractedUserId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required.' 
      }, { status: 401 });
    }

    if (user_id !== extractedUserId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID mismatch.' 
      }, { status: 401 });
    }

    // Forward to backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.hicontent.co';
    const response = await fetch(`${backendUrl}/api/v1/instagram/refresh-posts-new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ user_id, instagram_account_id }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error.' 
    }, { status: 500 });
  }
} 