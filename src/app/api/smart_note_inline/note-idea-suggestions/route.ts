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
      console.warn(`[${requestId}] Authentication failed: No Authorization header or invalid format`);
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
    }

    const body = await request.json();
    const { noteId, noteContent, limit = 5 } = body;
    
    if (!noteContent) {
      console.warn(`[${requestId}] Invalid request: Missing required fields`);
      return NextResponse.json({ error: 'noteContent is required', status: 400 }, { status: 400 });
    }

    // Prepare payload for backend
    const payload = {
      noteId,
      noteContent,
      limit
    };

    const headersToSend = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    const response = await fetch(`${BACKEND_URL}/api/v1/smart-notes-inline/note-idea-suggestions`, {
      method: 'POST',
      headers: headersToSend,
      body: JSON.stringify(payload)
    });

    let backendData = null;
    try {
      backendData = await response.clone().json();
    } catch (jsonErr) {
      // Handle non-JSON responses gracefully
    }

    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status} (${response.statusText})`);
    }

    const data = backendData;
    const totalDuration = Date.now() - startTime;

    console.info(`[${requestId}] Note idea suggestions completed`, {
      duration_ms: totalDuration,
      ideas_count: data.ideas?.length || 0
    });

    return NextResponse.json(data);
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[${requestId}] Note idea suggestions failed`, {
      error: errorMessage,
      duration_ms: totalDuration
    });

    return NextResponse.json({
      success: false,
      error: 'Note Idea Suggestions Failed',
      message: errorMessage,
      metadata: {
        request_id: requestId,
        processing_time_ms: totalDuration
      }
    }, { status: 500 });
  }
}
