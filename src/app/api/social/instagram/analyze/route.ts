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
    
    // Extract the API key from the Authorization header
    let apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (!apiKey) {
      console.warn(`[${requestId}] Authentication failed: No API key found`);
      return NextResponse.json({ error: 'Unauthorized - Missing API key' }, { status: 401 });
    }
    
    // Remove any quotes from the API key
    apiKey = apiKey.replace(/"/g, '');
    console.log(`[${requestId}] Cleaned API KEY:`, apiKey);

    const body = await request.json();
    const { post_url, content } = body;

    if (!post_url) {
      console.warn(`[${requestId}] Invalid request: Missing post_url`);
      return NextResponse.json({ error: 'post_url is required' }, { status: 400 });
    }
    
    // Extract post ID from the URL or use directly if it's already an ID
    const post_id = extractPostId(post_url);
    if (!post_id) {
      console.warn(`[${requestId}] Invalid request: Could not extract post ID from URL`);
      return NextResponse.json({ error: 'Invalid Instagram post URL' }, { status: 400 });
    }

    // Extract user ID from the cleaned API key (format: heycontent_USER_ID_HASH)
    const apiKeyParts = apiKey.split('_');
    
    // Get the user ID (second part of the key)
    let user_id: string;
    if (apiKeyParts.length >= 2 && apiKeyParts[0] === 'heycontent') {
      user_id = apiKeyParts[1];
      console.log(`[${requestId}] Extracted user_id: ${user_id}`);
    } else {
      console.warn(`[${requestId}] Could not extract user_id from API key, using default`);
      user_id = "default_user_id";
    }

    // Log the request details
    console.info(`[${requestId}] Processing Instagram post analysis`, {
      post_url: post_url,
      post_id: post_id,
      has_api_key: !!apiKey,
      user_id: user_id
    });

    // Prepare the request to the backend
    console.debug(`[${requestId}] Sending request to backend`, {
      url: `${BACKEND_URL}/api/v1/instagram/analyze`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}` // Using cleaned API key
      },
      body: {
        user_id, // Using correctly extracted user_id
        post_id
      }
    });

    // Fetch from backend with retry logic
    const maxRetries = 3;
    const backoffTimes = [500, 1000, 2000]; // ms
    let response: Response | null = null;
    let lastError: any = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      response = await fetch(`${BACKEND_URL}/api/v1/instagram/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}` // Using cleaned API key
        },
        body: JSON.stringify({
          user_id, // Using correctly extracted user_id
          post_id
        })
      });
      
      if (response.status !== 500 && response.status !== 429) {
        break; // Success or other error, don't retry
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

    // Log backend response headers and status
    console.debug(`[${requestId}] Backend response status`, response.status, response.statusText);

    // Process the response
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
  } catch (error: any) {
    console.error(`[${requestId}] Error processing Instagram analysis:`, error);
    return NextResponse.json({ 
      error: `An error occurred: ${error.message || 'Unknown error'}` 
    }, { 
      status: 500 
    });
  }
}