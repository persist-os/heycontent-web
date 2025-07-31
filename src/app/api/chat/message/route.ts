import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';
import { resolveLinkContent, parseContentId } from '@/app/dashboard/chat/utils/link-content-resolver';

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
    // Get API key and user ID from Authorization header
    const authHeader = request.headers.get('Authorization');
    const { apiKey, userId } = extractAuthInfo(authHeader);
    
    if (!apiKey) {
      console.warn(`[${requestId}] Authentication failed: No Authorization header or invalid format`);
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
    }

    const body = await request.json();
    const { query, is_first_message, session_id, content_context, vector_search_metadata, link_content } = body;
    
    // Extract content IDs for context resolution
    const contentIdPattern = /@\[([^\]]+)\]@/g;
    const contentIds: string[] = [];
    let match;
    while ((match = contentIdPattern.exec(query)) !== null) {
      contentIds.push(match[1]);
    }
    
    console.log(`[${requestId}] Received request body:`, {
      query_length: query?.length || 0,
      has_session_id: !!session_id,
      has_content_context: !!content_context,
      has_vector_search_metadata: !!vector_search_metadata,
      has_link_content: !!link_content,
      link_content_count: link_content?.length || 0,
      link_content_types: link_content?.map((item: any) => item.type) || [],
      body_keys: Object.keys(body)
    });

    if (!query) {
      console.warn(`[${requestId}] Invalid request: Missing query`);
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Always extract user_id from API key, never from client
    const user_id = userId;
    if (!user_id) {
      console.warn(`[${requestId}] Authentication failed: Could not determine user_id from API key`);
      return NextResponse.json({ error: 'Unauthorized - Invalid API key format or missing user_id' }, { status: 401 });
    }
    console.debug(`[${requestId}] Extracted user_id from API key:`, user_id);

    // Log the request details with more explicit information about is_first_message
    console.info(`[${requestId}] Processing chat message`, {
      session_id: session_id || 'null',
      is_first_message: !!is_first_message,
      is_first_message_raw: is_first_message,
      is_first_message_type: typeof is_first_message,
      query_length: query?.length,
      has_api_key: !!apiKey,
      user_id: user_id,
      has_content_context: !!content_context,
      content_context_platform: content_context?.platform,
      has_vector_search: !!vector_search_metadata,
      has_link_content: !!(link_content && Array.isArray(link_content) && link_content.length > 0),
      link_content_count: link_content?.length || 0
    });

    // Prepare the request body for the backend
    const backendRequestBody: any = {
      user_id,
      query,
      is_first_message: is_first_message === true,
      session_id: is_first_message === true ? null : (session_id || null)
    };
    
    // Variable to store the user message with titles for chat history
    let userMessageWithTitles = query;

    // Include content context if provided
    if (content_context) {
      backendRequestBody.content_context = content_context;
    }

    // Include vector search metadata if provided
    if (vector_search_metadata) {
        backendRequestBody.vector_search_metadata = vector_search_metadata;
    }

    // Process and inject link content into the query context
    if (link_content && Array.isArray(link_content) && link_content.length > 0) {
      console.log(`[${requestId}] Processing link content:`, {
        count: link_content.length,
        types: link_content.map((item: any) => item.type)
      });

      // Create a context message with all linked content
      const linkContextMessages = link_content.map((item: any) => {
        const contentType = item.type === 'smart_note' ? 'Smart Note' : 
                           item.type === 'youtube' ? 'YouTube Video Analysis' : 
                           item.type === 'insight' ? 'AI Insight' : 'Content';
        
        // Debug: log the content to see what we're working with
        console.log(`[${requestId}] Processing ${contentType} content:`, {
          type: item.type,
          title: item.title,
          contentType: typeof item.content,
          contentLength: item.content?.length || 0,
          contentPreview: typeof item.content === 'string' ? item.content.substring(0, 100) : JSON.stringify(item.content).substring(0, 100)
        });
        
        // Ensure content is a string
        const contentString = typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
        
        return `[${contentType}: ${item.title}]\n${contentString}`;
      });

      const linkContextText = linkContextMessages.join('\n\n');
      
      // Replace link tokens in the user message with titles using the already resolved link content
      let userMessageWithTitles = query;
      
      // Create a mapping of content IDs to titles from the resolved link content
      const contentIdToTitle = new Map();
      
      // Extract all content IDs from the original message
      const contentIdPattern = /@\[([^\]]+)\]@/g;
      const contentIds: string[] = [];
      let match;
      while ((match = contentIdPattern.exec(query)) !== null) {
        contentIds.push(match[1]);
      }
      
      console.log(`[${requestId}] Extracted content IDs:`, contentIds);
      
      // Create a mapping by matching content IDs to resolved content
      // More robust mapping: try to match by contentId first, then by index
      for (const contentId of contentIds) {
        // First try to find by exact contentId match
        let resolvedItem = link_content.find(item => item.contentId === contentId);
        
        if (!resolvedItem) {
          // If not found by exact match, try to find by type and partial match
          if (contentId.startsWith('notes:') || contentId.startsWith('note:')) {
            const actualNoteId = contentId.replace(/^(notes?):/, '');
            resolvedItem = link_content.find(item => 
              item.type === 'smart_note' && 
              (item.contentId === actualNoteId || item.contentId === contentId)
            );
          }
        }
        
        if (resolvedItem) {
          contentIdToTitle.set(contentId, resolvedItem.title);
        }
      }
      
      // Replace each link token with its title
      userMessageWithTitles = userMessageWithTitles.replace(/@\[([^\]]+)\]@/g, (match, contentId) => {
        const title = contentIdToTitle.get(contentId);
        return title ? `[${title}]` : match;
      });
      
      console.log(`[${requestId}] Title replacement:`, {
        original: query,
        replaced: userMessageWithTitles,
        contentIdToTitle: Object.fromEntries(contentIdToTitle)
      });
      
      // Inject the link content context into the query
      const enhancedQuery = `[Context from linked content]\n\n${linkContextText}\n\n---\n\nUser message: ${userMessageWithTitles}`;
      
      console.log(`[${requestId}] Enhanced query with link content:`, {
        originalLength: query.length,
        enhancedLength: enhancedQuery.length,
        linkContentCount: link_content.length,
        userMessageWithTitles
      });

      // Update the query with the enhanced version
      backendRequestBody.query = enhancedQuery;
    } else {
      // If no link content, use the original query
      backendRequestBody.query = query;
    }

    // Log the full request body
    console.debug(`[${requestId}] Sending request to backend`, {
      url: `${BACKEND_URL}/api/v1/chat`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: {
        ...backendRequestBody,
        link_content_count: link_content?.length || 0,
        link_content_types: link_content?.map((item: any) => item.type) || []
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
        body: JSON.stringify(backendRequestBody)
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

    // After fetching the backend response:
    if (response.status === 401 || response.status === 403) {
      // Propagate auth errors to the frontend
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Your session has expired or you are not authorized. Please log in again.'
      }, { status: response.status });
    }

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
        // First, check if we already have a chat_response in the data
        if (data.chat_response) {
          chat_response = data.chat_response;
        } else {
          // Use the response field as the chat_response
          chat_response = data.response;
        }
        
        // If we have suggestions in the data, use those
        if (Array.isArray(data.suggestions)) {
          suggestions = data.suggestions;
        }
        
        // If we don't have a chat_response yet, try to parse the response as JSON
        if (!chat_response) {
          // Remove markdown code block if present
          let respStr = data.response.trim();
          if (respStr.startsWith('```json')) {
            respStr = respStr.slice(7);
          }
          if (respStr.endsWith('```')) {
            respStr = respStr.slice(0, -3);
          }
          
          try {
            const parsed = JSON.parse(respStr);
            chat_response = parsed.chat_response || parsed.response || '';
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
          }
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
      vector_search_metadata: vector_search_metadata,
      user_message: userMessageWithTitles, // Use the title-replaced message for chat history
      metadata: {
        request_id: requestId,
        processing_time_ms: totalDuration
      }
    };

    console.log(`[${requestId}] Sending response with user_message:`, {
      originalQuery: query,
      userMessageWithTitles,
      hasUserMessage: !!userMessageWithTitles,
      userMessageLength: userMessageWithTitles?.length
    });

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