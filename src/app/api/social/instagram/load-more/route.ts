import { NextRequest, NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

export async function POST(req: NextRequest) {
  try {
    const { userId, instagramAccountId } = await req.json();
    if (!userId || !instagramAccountId) {
      return NextResponse.json({ 
        success: false, 
        error: 'We need your user ID and Instagram account to load more posts. Thanks for being here—let\'s get you set up!' 
      }, { status: 400 });
    }

    // Extract API key and user ID from Authorization header
    const authHeader = req.headers.get('Authorization');
    const { apiKey, userId: extractedUserId } = extractAuthInfo(authHeader);
    
    if (!apiKey || !extractedUserId) {
      return NextResponse.json({ 
        success: false, 
        error: 'We need to know it\'s you to keep your content safe! Please log in again and let\'s get back to creating amazing things together.' 
      }, { status: 401 });
    }

    // Verify that the user ID from the request matches the one extracted from the API key
    if (userId !== extractedUserId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Your authentication needs a quick refresh! No worries—this happens to the best of us. Let\'s reconnect and get you back to creating.' 
      }, { status: 401 });
    }

    // Call the backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.hicontent.co';
    const response = await fetch(`${backendUrl}/api/v1/instagram/fetch-next-page`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ 
        userId, 
        instagramAccountId 
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Your Instagram posts are taking a moment to load. Thanks for your patience—great content is worth waiting for!' 
    }, { status: 500 });
  }
} 