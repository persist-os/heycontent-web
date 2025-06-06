import { NextResponse } from 'next/server';
import dotenv from 'dotenv';
import { getUserIdFromToken } from '@/app/lib/getUserIdFromToken';

dotenv.config();

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Handle PATCH requests to update a note
export async function PATCH(
  request: Request,
  { params }: { params: { noteId: string } }
) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  const noteId = params.noteId;

  console.log(`[${requestId}] Smart note update request started for note ${noteId}`, {
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

    const userId = await getUserIdFromToken(apiKey);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - Invalid Firebase token' }, { status: 401 });
    }

    // Log the raw request body
    const rawBody = await request.text();
    console.log(`[${requestId}] Raw request body:`, rawBody);
    // Parse the JSON body
    const updateFields = rawBody ? JSON.parse(rawBody) : {};
    console.log(`[${requestId}] Parsed updateFields:`, updateFields);
    const backendBody = {
      userId,
      updates: updateFields
    };
    console.log(`[${requestId}] Request body for note update (to backend):`, backendBody);

    if (!backendBody || typeof backendBody !== 'object' || Object.keys(backendBody).length === 0) {
      console.warn(`[${requestId}] Invalid request: No fields provided for update/save`);
      return NextResponse.json({ error: 'At least one field is required to update/save a note', status: 400 }, { status: 400 });
    }

    // Log the request to the backend
    console.info(`[${requestId}] Sending request to backend API`, {
      url: `${BACKEND_URL}/api/v1/smart-note/${noteId}`,
      method: 'PATCH',
      noteId
    });

    const response = await fetch(`${BACKEND_URL}/api/v1/smart-note/${noteId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(backendBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`[${requestId}] Backend API error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: `${BACKEND_URL}/api/v1/smart-note/${noteId}`
      });
      throw new Error(`Backend API responded with status: ${response.status} (${response.statusText})`);
    }

    const data = await response.json();
    const totalDuration = Date.now() - startTime;

    // Log success with more details
    console.info(`[${requestId}] Request completed successfully`, {
      duration_ms: totalDuration,
      update_success: data.success || false,
      note_id: noteId,
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
      error: 'Note Update Failed',
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

// Handle DELETE requests
export async function DELETE(
  request: Request,
  { params }: { params: { noteId: string } }
) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  const noteId = params.noteId;

  console.log(`[${requestId}] Smart note delete request started for note ${noteId}`, {
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

    // Log the request to the backend
    console.info(`[${requestId}] Sending request to backend API`, {
      url: `${BACKEND_URL}/api/v1/smart-note/${noteId}`,
      method: 'DELETE',
      noteId
    });

    const response = await fetch(`${BACKEND_URL}/api/v1/smart-note/${noteId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`[${requestId}] Backend API error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: `${BACKEND_URL}/api/v1/smart-note/${noteId}`
      });
      throw new Error(`Backend API responded with status: ${response.status} (${response.statusText})`);
    }

    const data = await response.json();
    const totalDuration = Date.now() - startTime;

    // Log success with more details
    console.info(`[${requestId}] Request completed successfully`, {
      duration_ms: totalDuration,
      delete_success: data.success || false,
      note_id: noteId,
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
      error: 'Note Delete Failed',
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