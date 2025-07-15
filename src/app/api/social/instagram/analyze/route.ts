import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Helper function to extract Instagram post ID from URL or return the ID if already provided
function extractPostId(postUrlOrId: string): string | null {
  // If it's a URL, extract the ID
  if (postUrlOrId.includes('instagram.com')) {
    // Handle URLs like https://www.instagram.com/p/ABC123/
    const match = postUrlOrId.match(/instagram\.com\/p\/([\w-]+)/);
    if (match && match[1]) {
      return match[1];
    }
    // Handle URLs like https://www.instagram.com/reel/ABC123/
    const reelMatch = postUrlOrId.match(/instagram\.com\/reel\/([\w-]+)/);
    if (reelMatch && reelMatch[1]) {
      return reelMatch[1];
    }
    return null;
  }
  // If it's already an ID (no slashes or instagram.com), return as is
  return postUrlOrId;
}

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();

  console.log(`[${requestId}] Instagram post analysis request started`, {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  });

  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[${requestId}] Authentication failed: No Authorization header or invalid format`);
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
    }
    
    // Extract the API key
    const apiKey = authHeader.substring(7).replace(/"/g, '');
    console.log(`[${requestId}] Cleaned API KEY:`, apiKey);

    const body = await request.json();
    const { post_id, format } = body;

    if (!post_id) {
      console.warn(`[${requestId}] Invalid request: Missing post_id`);
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
    }

    // Extract user ID from API key
    const apiKeyParts = apiKey.split('_');
    const user_id = apiKeyParts.length >= 2 && apiKeyParts[0] === 'heycontent' ? apiKeyParts[1] : "default_user_id";
    console.log(`[${requestId}] Extracted user_id: ${user_id}`);

    // Log request details
    console.info(`[${requestId}] Processing Instagram post analysis`, {
      post_id,
      format,
      has_api_key: !!apiKey,
      user_id
    });

    // Prepare the backend request
    const backendUrl = `${BACKEND_URL}/api/v1/instagram/analyze`;
    console.debug(`[${requestId}] Sending request to backend`, {
      url: backendUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const requestBody = {
      post_id: post_id,
      user_id: user_id,
      ...(format && { format }) // Include format if provided
    };

    // Fetch from backend with retry logic
    const maxRetries = 3;
    const backoffTimes = [500, 1000, 2000];
    let response = null;
    let lastError = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
      });
      
      if (response.status !== 500 && response.status !== 429) {
        break;
      }
      
      lastError = `Backend responded with status ${response.status}`;
      console.warn(`[${requestId}] Backend responded with ${response.status}. Retrying in ${backoffTimes[attempt] || 0}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      if (attempt < maxRetries) {
        await new Promise(res => setTimeout(res, backoffTimes[attempt]));
      }
    }
    
    if (!response || response.status === 500 || response.status === 429) {
      throw new Error(lastError || 'Backend unavailable after retries');
    }

    // Log backend response
    console.debug(`[${requestId}] Backend response status`, response.status, response.statusText);

    if (!response.ok) {
      console.error(`[${requestId}] Backend API error with status: ${response.status}`);
      return NextResponse.json({ 
        error: `Error analyzing Instagram post: ${response.statusText}` 
      }, { 
        status: response.status 
      });
    }

    const data = await response.json();
    console.debug(`[${requestId}] Instagram analysis successful`, {
      responseTime: Date.now() - startTime,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error(`[${requestId}] Error processing Instagram analysis:`, error);
    return NextResponse.json({ 
      error: `An error occurred: ${error.message || 'Unknown error'}` 
    }, { 
      status: 500 
    });
  }
}