import { NextResponse } from 'next/server';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[${requestId}] Smart note save request started`, {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  });

  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '').trim();
    if (!apiKey) {
      console.warn(`[${requestId}] Authentication failed: No Authorization header or invalid format`);
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    const { content, platform, metadata, analysisResult } = body;

    // Prepare payload that matches backend SmartNoteRequest model, but do NOT send userId
    const smartNotePayload = {
      content: content,
      platform: platform || 'general',
      createdAt: Date.now(),
      type: metadata?.type || 'note',
      templateInput: metadata?.templateInput || null,
      analysisId: analysisResult?.analysisId || null
    };

    // Log the backend request
    console.info(`[${requestId}] Sending request to backend API`, {
      url: `${BACKEND_URL}/api/v1/smart-note/save`,
      payload: {
        contentLength: smartNotePayload.content?.length || 0,
        platform: smartNotePayload.platform,
        createdAt: smartNotePayload.createdAt,
        type: smartNotePayload.type,
        hasTemplateInput: !!smartNotePayload.templateInput,
        hasAnalysisId: !!smartNotePayload.analysisId
      }
    });

    const response = await fetch(`${BACKEND_URL}/api/v1/smart-note/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(smartNotePayload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`[${requestId}] Backend API error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: `${BACKEND_URL}/api/v1/smart-note/save`
      });
      throw new Error(`Backend API responded with status: ${response.status} (${response.statusText})`);
    }

    const data = await response.json();
    const totalDuration = Date.now() - startTime;

    // Validate the response data structure
    if (!data || typeof data !== 'object') {
      console.error(`[${requestId}] Invalid response data format:`, {
        dataType: typeof data,
        data: data ? JSON.stringify(data).substring(0, 100) + '...' : 'null'
      });
      throw new Error('Invalid response data format from backend');
    }

    // Log success with more details
    console.info(`[${requestId}] Request completed successfully`, {
      duration_ms: totalDuration,
      save_success: data.success || false,
      note_id: data.noteId || null,
      response_size: JSON.stringify(data).length
    });

    // Return the response data
    return NextResponse.json(data);
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    console.error(`[${requestId}] Request failed: ${errorName}`, {
      error: errorMessage,
      stack: errorStack,
      duration_ms: totalDuration,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({
      success: false,
      error: 'Save Failed',
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