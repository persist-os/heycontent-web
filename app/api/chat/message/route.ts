import { NextResponse } from 'next/server';

import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[${requestId}] Chat message request started`, {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  });

  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[${requestId}] Authentication failed: No Authorization header or invalid format`);
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
    }
    
    // Extract the API key from the Authorization header
    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (!apiKey) {
      console.warn(`[${requestId}] Authentication failed: No API key found`);
      return NextResponse.json({ error: 'Unauthorized - Missing API key' }, { status: 401 });
    }

    const body = await request.json();
    const { query, is_first_message, session_id } = body;

    if (!query) {
      console.warn(`[${requestId}] Invalid request: Missing query`);
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Always extract user_id from API key, never from client
    let user_id: string | undefined = undefined;
    const apiKeyParts = apiKey.split('_');
    if (apiKeyParts.length >= 2) {
      user_id = apiKeyParts[1];
    }
    if (!user_id) {
      console.warn(`[${requestId}] Authentication failed: Could not determine user_id from API key`);
      return NextResponse.json({ error: 'Unauthorized - Invalid API key format or missing user_id' }, { status: 401 });
    }
    console.debug(`[${requestId}] Extracted user_id from API key:`, user_id);

    // Log the request details
    console.info(`[${requestId}] Processing chat message`, {
      session_id: session_id || 'null',
      is_first_message: !!is_first_message,
      query_length: query?.length,
      has_api_key: !!apiKey,
      user_id: user_id
    });

    // Log the full request body
    console.debug(`[${requestId}] Sending request to backend`, {
      url: `${BACKEND_URL}/api/v1/chat`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: {
        user_id,
        query,
        is_first_message: is_first_message === true,
        session_id: is_first_message === true ? null : (session_id || null)
      }
    });

    // Retry logic with exponential backoff for 500/429 errors
    const maxRetries = 4;
    const backoffTimes = [500, 1000, 2000, 4000]; // ms
    let response: Response | null = null;
    let lastError: any = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      response = await fetch(`${BACKEND_URL}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          user_id,
          query,
          is_first_message: is_first_message === true,
          session_id: is_first_message === true ? null : (session_id || null)
        })
      });
      if (response.status !== 500 && response.status !== 429) {
        break; // Success or other error, don't retry
      }
      lastError = `Backend responded with status ${response.status}`;
      console.warn(`[${requestId}] Backend responded with ${response.status}. Retrying in ${backoffTimes[attempt] || 0}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      if (attempt < maxRetries) {
        await new Promise(res => setTimeout(res, backoffTimes[attempt]));
      }
    }
    if (!response || response.status === 500 || response.status === 429) {
      throw new Error(lastError || 'Backend unavailable after retries');
    }

    // Log backend response headers and status
    console.debug(`[${requestId}] Backend response status`, response.status, response.statusText);
    console.debug(`[${requestId}] Backend response headers`, Object.fromEntries(response.headers.entries()));

    // Enhanced response handling with content-type detection
    let data: any;
    let chat_response: string | undefined;
    let suggestions: any[] = [];
    let session_id_resp: string | undefined;
    
    try {
      // Check content type to determine parsing strategy
      const contentType = response.headers.get('Content-Type') || '';
      
      if (!response.ok) {
        console.error(`[${requestId}] Backend API error with status: ${response.status}`);
        throw new Error(`Backend API responded with status: ${response.status}`);
      }
      
      if (contentType.includes('application/json')) {
        // Standard JSON handling
        data = await response.json();
        console.debug(`[${requestId}] Raw backend JSON data`, data);
        // Proactive error/permission handling
        if (data && (data.error || data.response?.toLowerCase().includes('forbidden') || data.response?.toLowerCase().includes('only access your own'))) {
          const msg = typeof data.error === 'string' ? data.error : 'You are not authorized to access this chat.';
          const status = data.error?.includes('401') || data.error?.toLowerCase().includes('unauthorized') ? 401 : 403;
          return NextResponse.json({ error: msg }, { status });
        }
      } else {
        // Handle non-JSON responses (text, html, etc.)
        const textResponse = await response.text();
        console.debug(`[${requestId}] Raw backend text response`, textResponse);
        
        // Try to extract JSON if it's embedded in text
        try {
          // First check if the whole text is valid JSON despite content-type
          data = JSON.parse(textResponse);
          console.debug(`[${requestId}] Parsed JSON from text response despite content-type`, data);
        } catch (parseErr) {
          // Try to find JSON-like content in the text
          try {
            // Match anything that looks like JSON using regex
            // Using a workaround for the 's' flag compatibility
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch && jsonMatch[0]) {
              data = JSON.parse(jsonMatch[0]);
              console.debug(`[${requestId}] Extracted JSON from text response`, data);
            } else {
              // Fallback: create a structured response with the text as chat_response
              data = { 
                response: textResponse,
                chat_response: textResponse,
                suggestions: [],
                session_id: session_id
              };
              console.debug(`[${requestId}] Created fallback data object from text`, data);
            }
          } catch (extractErr) {
            // Ultimate fallback: just use the text response directly
            data = { 
              response: textResponse,
              chat_response: textResponse,
              suggestions: [],
              session_id: session_id
            };
            console.debug(`[${requestId}] Created ultimate fallback data from text`, data);
          }
        }
      }
      
      // Extract the response components with fallbacks
      if (data.error) {
        chat_response = 'Sorry, you are not authorized to access this chat or there was a permissions error.';
        suggestions = [];
      } else {
        chat_response = data.chat_response;
        suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
      }
      session_id_resp = data.session_id;
    } catch (error) {
      console.error(`[${requestId}] Response processing error:`, error);
      // Provide a graceful fallback instead of throwing
      data = { 
        chat_response: "Sorry, I encountered an issue processing the response. Please try again.",
        suggestions: [],
        session_id: session_id
      };
      chat_response = data.chat_response;
      suggestions = [];
      session_id_resp = session_id;
    }
    
    // Log the processed data
    console.debug(`[${requestId}] Processed response data`, {
      has_chat_response: !!chat_response,
      chat_response_length: chat_response?.length || 0,
      suggestions_count: suggestions?.length || 0,
      session_id: session_id_resp
    });

    // Parse embedded JSON in response field if needed
    if (!chat_response && typeof data.response === 'string') {
      try {
        // Remove markdown code block if present
        let respStr = data.response.trim();
        if (respStr.startsWith('```json')) {
          respStr = respStr.slice(7);
        }
        if (respStr.endsWith('```')) {
          respStr = respStr.slice(0, -3);
        }
        
        // Try to parse the response as JSON
        try {
          const parsed = JSON.parse(respStr);
          chat_response = parsed.chat_response || '';
          if (Array.isArray(parsed.suggestions)) {
            suggestions = parsed.suggestions;
          }
          // Successfully parsed JSON response
        } catch (err) {
          // Always handle non-JSON responses gracefully
          console.error(`[${requestId}] Response is not valid JSON, treating as plain text.`, {
            error: err,
            response: respStr
          });
          // Use the plain text response directly instead of showing an error message
          chat_response = respStr;
          suggestions = [];
        }
      } catch (parseErr) {
        console.error(`[${requestId}] Error processing backend response string`, parseErr);
        chat_response = data.response || "I encountered an issue processing the response.";
      }
    }
    
    // Final fallback - if we somehow still don't have a chat_response
    if (!chat_response && data.response) {
      chat_response = typeof data.response === 'string' ? data.response : JSON.stringify(data.response);
    } else if (!chat_response) {
      chat_response = "I received a response but couldn't process it properly.";
    }

    const totalDuration = Date.now() - startTime;
    console.info(`[${requestId}] Request completed successfully`, {
      duration_ms: totalDuration,
      chat_response_length: chat_response?.length || 0,
      suggestions_count: suggestions?.length || 0,
      session_id: session_id_resp
    });

    // Return the correct structure to the frontend
    const responseData = {
      chat_response: chat_response,
      suggestions: suggestions || [],
      session_id: session_id_resp,
      metadata: {
        request_id: requestId,
        processing_time_ms: totalDuration
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[${requestId}] Request failed`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration_ms: totalDuration,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      metadata: {
        request_id: requestId,
        processing_time_ms: totalDuration
      }
    }, { status: 500 });
  }
}