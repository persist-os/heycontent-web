import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();

  console.log(`[${requestId}] YouTube analysis request started`, {
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
    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (!apiKey) {
      console.warn(`[${requestId}] Authentication failed: No API key found`);
      return NextResponse.json({ error: 'Unauthorized - Missing API key' }, { status: 401 });
    }

    const body = await request.json();
    const { video_url } = body;

    if (!video_url) {
      console.warn(`[${requestId}] Invalid request: Missing video_url`);
      return NextResponse.json({ error: 'video_url is required' }, { status: 400 });
    }

    // Always extract user_id from API key, never from client
    let user_id: string | undefined = undefined;
    const apiKeyParts = apiKey.split('_');
    if (apiKeyParts.length >= 2) {
      user_id = apiKeyParts[1];
    }
    if (!user_id) {
      console.warn(`[${requestId}] Authentication failed: Could not determine user_id from API key`);
      return NextResponse.json({ error: 'Unauthorized - Invalid API key format or missing user_id' }, { status: 401 });
    }
    console.debug(`[${requestId}] Extracted user_id from API key:`, user_id);

    // Log the request details
    console.info(`[${requestId}] Processing YouTube analysis`, {
      video_url: video_url,
      has_api_key: !!apiKey,
      user_id: user_id
    });

    // Prepare the request to the backend
    console.debug(`[${requestId}] Sending request to backend`, {
      url: `${BACKEND_URL}/api/v1/youtube/analyze`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: {
        user_id,
        video_url
      }
    });

    // Fetch from backend with retry logic
    const maxRetries = 3;
    const backoffTimes = [500, 1000, 2000]; // ms
    let response: Response | null = null;
    let lastError: any = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      response = await fetch(`${BACKEND_URL}/api/v1/youtube/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          user_id,
          video_url
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
        error: `Error analyzing YouTube video: ${response.statusText}` 
      }, { 
        status: response.status 
      });
    }

    const data = await response.json();
    console.debug(`[${requestId}] YouTube analysis successful`, {
      responseTime: Date.now() - startTime,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`[${requestId}] Error processing YouTube analysis:`, error);
    return NextResponse.json({ 
      error: `An error occurred: ${error.message || 'Unknown error'}` 
    }, { 
      status: 500 
    });
  }
}
