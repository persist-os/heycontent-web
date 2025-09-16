import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  console.log('🚀 [project-discovery-api] PROJECT DISCOVERY ROUTE HIT!');
  
  try {
    // Get the request body
    const body = await request.json();
    
    console.log('🚀 [project-discovery-api] Received request:', {
      user_id: body.user_id,
      query_length: body.query?.length || 0,
      has_content_context: !!body.content_context,
      project_name: body.project_name,
      backend_url: BACKEND_URL,
      timestamp: new Date().toISOString()
    });

    // Forward the request to the backend project discovery endpoint
    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/project-discovery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
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
