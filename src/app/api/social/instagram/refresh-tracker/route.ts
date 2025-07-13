import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();

  try {
    const { user_id, instagram_account_id } = await request.json();

    if (!user_id) {
      return NextResponse.json({ 
        error: 'user_id is required' 
      }, { 
        status: 400 
      });
    }

    if (!instagram_account_id) {
      return NextResponse.json({ 
        error: 'instagram_account_id is required' 
      }, { 
        status: 400 
      });
    }

    console.log(`[${requestId}] Starting Instagram tracker refresh for user ${user_id}, account ${instagram_account_id}`);

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ 
        error: 'Authorization header is required' 
      }, { 
        status: 401 
      });
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/v1/instagram/refresh-tracker`;
    
    const requestBody = {
      user_id,
      token_data: {
        instagram_account_id
      }
    };

    console.log(`[${requestId}] Calling backend refresh-tracker endpoint`);

    // Call the backend refresh-tracker endpoint
    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authHeader
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

        return NextResponse.json({ 
          error: `Error refreshing Instagram tracker: ${response.statusText}`,
          details: errorData
        }, { 
          status: response.status 
        });
      }

      const data = await response.json();
      console.log(`[${requestId}] Instagram tracker refresh successful`, {
        responseTime: Date.now() - startTime,
        status: data.status,
        analysis_generated: !!data.data
      });

      // Return the backend response
      return NextResponse.json(data);
    } catch (fetchError) {
      console.error(`[${requestId}] Backend connection error:`, fetchError);
      return NextResponse.json({
        error: 'Failed to connect to backend service',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      }, {
        status: 503
      });
    }
  } catch (error) {
    console.error(`[${requestId}] Error processing Instagram tracker refresh:`, error);
    return NextResponse.json({ 
      error: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { 
      status: 500 
    });
  }
} 