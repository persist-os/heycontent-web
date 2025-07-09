import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userId, instagramAccountId } = await req.json();
    if (!userId || !instagramAccountId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing userId or instagramAccountId' 
      }, { status: 400 });
    }

    // Get API key from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing or invalid Authorization header' 
      }, { status: 401 });
    }
    
    // Extract the API key
    const apiKey = authHeader.substring(7).replace(/"/g, '');
    
    // Extract user ID from API key
    const apiKeyParts = apiKey.split('_');
    const user_id = apiKeyParts.length >= 2 && apiKeyParts[0] === 'heycontent' ? apiKeyParts[1] : null;
    
    if (!user_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid API key format' 
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
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 