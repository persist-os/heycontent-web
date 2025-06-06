import { NextResponse } from 'next/server';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '').trim();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Proxy to backend smart-note-ideas endpoint
    const response = await fetch(`${BACKEND_URL}/api/v1/smart-note/ideas/generate-title`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Title generation proxy error:', error);
    return NextResponse.json({
      success: false,
      error: 'Title generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
