import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();

  console.log(`[${requestId}] Instagram analytics request started`, {
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

    // Extract user ID from API key
    const apiKeyParts = apiKey.split('_');
    const user_id = apiKeyParts.length >= 2 && apiKeyParts[0] === 'heycontent' ? apiKeyParts[1] : null;
    
    if (!user_id) {
      console.warn(`[${requestId}] Invalid API key format`);
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 401 });
    }
    
    console.log(`[${requestId}] Extracted user_id: ${user_id}`);

    // Log request details
    console.info(`[${requestId}] Processing Instagram analytics`, {
      has_api_key: !!apiKey,
      user_id
    });

    // Prepare the backend request
    const backendUrl = `${BACKEND_URL}/api/v1/instagram/analytics`;
    const requestBody = { user_id };
    
    console.debug(`[${requestId}] Sending request to backend`, {
      url: backendUrl,
      method: 'POST',
      body: requestBody,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Single attempt to fetch from backend
    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      // Handle backend errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[${requestId}] Backend API error:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });

        // Check for specific backend errors
        const errorMessage = errorData.error || response.statusText;
        if (errorMessage.includes('replace_nulls') || 
            errorMessage.includes('local variable') ||
            errorMessage.includes('module')) {
          console.warn(`[${requestId}] Backend analysis error, returning default structure`);
          return NextResponse.json({
            analysis: {
              content: {
                last_post: { date: null, type: null, time_ago: null },
                posting_frequency: {
                  average_days_between_posts: null,
                  has_recent_posts: false,
                  total_posts_last_7_days: '0'
                },
                media_distribution: {
                  regular_post: '0%',
                  carousel: '0%',
                  reel: '0%',
                  story: '0%'
                }
              }
            }
          });
        }

        return NextResponse.json({ 
          error: `Error analyzing Instagram profile: ${response.statusText}`,
          details: errorData
        }, { 
          status: response.status 
        });
      }

      const data = await response.json();
      console.debug(`[${requestId}] Instagram analysis successful`, {
        responseTime: Date.now() - startTime,
      });

      return NextResponse.json(data);
    } catch (fetchError) {
      console.error(`[${requestId}] Backend connection error:`, fetchError);
      // Return a default structure when backend is not available
      return NextResponse.json({
        analysis: {
          content: {
            last_post: { date: null, type: null, time_ago: null },
            posting_frequency: {
              average_days_between_posts: null,
              has_recent_posts: false,
              total_posts_last_7_days: '0'
            },
            media_distribution: {
              regular_post: '0%',
              carousel: '0%',
              reel: '0%',
              story: '0%'
            }
          }
        }
      });
    }
  } catch (error) {
    console.error(`[${requestId}] Error processing Instagram analysis:`, error);
    return NextResponse.json({ 
      error: `An error occurred: ${error.message || 'Unknown error'}` 
    }, { 
      status: 500 
    });
  }
} 