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
    const { noteId, noteContent, noteType, title, platform, tags } = body;
    
    if (!noteContent || !noteType) {
      console.warn(`[${requestId}] Invalid request: Missing required fields`);
      return NextResponse.json({ error: 'noteContent and noteType are required', status: 400 }, { status: 400 });
    }

    // Prepare payload for backend
    const payload = {
      noteId,
      noteContent,
      noteType,
      title,
      platform,
      tags: tags || []
    };

    const headersToSend = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    const response = await fetch(`${BACKEND_URL}/api/v1/smart-notes-inline/smart-note-analysis`, {
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

    console.info(`[${requestId}] Smart note analysis completed`, {
      duration_ms: totalDuration,
      note_type: data.type,
      analysis_length: data.analysis?.length || 0
    });

    return NextResponse.json(data);
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[${requestId}] Smart note analysis failed`, {
      error: errorMessage,
      duration_ms: totalDuration
    });

    return NextResponse.json({
      success: false,
      error: 'Smart Note Analysis Failed',
      message: errorMessage,
      metadata: {
        request_id: requestId,
        processing_time_ms: totalDuration
      }
    }, { status: 500 });
  }
}
