import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    // Extract API key from Authorization header (optional for public translations)
    const authHeader = request.headers.get('Authorization') || '';
    const bearerPrefix = 'Bearer ';
    const apiKey = authHeader.startsWith(bearerPrefix)
      ? authHeader.slice(bearerPrefix.length).trim()
      : '';

    // Translations are public - backend middleware allows unauthenticated requests
    // Only include Authorization header if API key is provided

    const body = await request.json();
    const { texts, sourceLang = 'en', targetLang, context } = body;

    if (!texts || !Array.isArray(texts) || texts.length === 0 || !targetLang) {
      return NextResponse.json(
        { error: 'texts (array) and targetLang are required' },
        { status: 400 }
      );
    }

    // Backend batch endpoint supports up to 50 texts
    if (texts.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 texts per batch request' },
        { status: 400 }
      );
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Only add Authorization header if API key is provided
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const response = await fetch(`${BACKEND_URL}/api/v1/translate/batch`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        texts,
        sourceLang,
        targetLang,
        context,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'Batch translation failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Batch translation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

