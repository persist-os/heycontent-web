import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  console.log('🚀 [project-discovery-api] PROJECT DISCOVERY ROUTE HIT!');
  
  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('Authorization') || '';
    const bearerPrefix = 'Bearer ';
    const apiKey = authHeader.startsWith(bearerPrefix)
      ? authHeader.slice(bearerPrefix.length).trim()
      : '';

    if (!apiKey) {
      console.warn('[project-discovery-api] Authentication failed - no API key');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract user ID from API key (format: heycontent_userId_timestamp)
    const apiKeyParts = apiKey.split('_');
    const user_id = apiKeyParts.length >= 2 && apiKeyParts[0] === 'heycontent' ? apiKeyParts[1] : null;

    if (!user_id) {
      console.warn('[project-discovery-api] Invalid API key format - cannot extract user_id');
      return NextResponse.json({ error: 'Bad Request', detail: 'Invalid API key format' }, { status: 400 });
    }

    const body = await request.json();
    
    console.log('🚀 [project-discovery-api] Received request:', {
      user_id: user_id,
      query_length: body.query?.length || 0,
      has_content_context: !!body.content_context,
      project_name: body.project_name,
      backend_url: BACKEND_URL,
      timestamp: new Date().toISOString()
    });

    // Ensure the body includes the user_id for the backend
    const requestBody = {
      ...body,
      user_id: user_id
    };

    // Forward the request to the backend project discovery endpoint
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/project-discovery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!backendResponse.ok) {
      console.error('[project-discovery-api] Backend error:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText
      });
      throw new Error(`Backend responded with ${backendResponse.status}: ${backendResponse.statusText}`);
    }

    const responseData = await backendResponse.json();
    
    console.log('[project-discovery-api] Backend response:', {
      status: responseData.status,
      response_length: responseData.response?.length || 0,
      has_session_id: !!responseData.session_id,
      suggestions_count: responseData.suggestions?.length || 0
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[project-discovery-api] Error:', error);
    
    return NextResponse.json(
      { 
        response: 'I encountered an issue while exploring your project. Let me help you in a different way - could you tell me more about what you\'re working on?',
        status: 'error',
        session_id: '',
        user_message: '',
        suggestions: ['What is this project about?', 'What are your main goals?', 'How do you like to work on projects?'],
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      },
      { status: 500 }
    );
  }
}
