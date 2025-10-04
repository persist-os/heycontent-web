import { NextResponse } from 'next/server';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '').trim();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
    }

    const body = await request.json();
    const { noteId, noteContent } = body;
    
    if (!noteId || !noteContent) {
      return NextResponse.json({ error: 'noteId and noteContent are required', status: 400 }, { status: 400 });
    }

    // Prepare payload for backend
    const payload = {
      note_id: noteId,
      note_content: noteContent,
    };

    const response = await fetch(`${BACKEND_URL}/api/v1/smart-notes/generate-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'UnknownError';

    console.error(`[${requestId}] Metadata generation failed:`, errorMessage);

    return NextResponse.json({
      success: false,
      error: 'Smart Note Metadata Generation Failed',
      message: errorMessage,
      errorType: errorName,
      metadata: {
        request_id: requestId,
        processing_time_ms: totalDuration,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
} 