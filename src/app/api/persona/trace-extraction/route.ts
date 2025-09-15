import { NextResponse } from 'next/server';
import { authenticateRequest, type AuthResult, type AuthError } from '@/app/lib/api-helpers-server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Validation interfaces and functions
interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string | number;
  id?: string;
  metadata?: Record<string, any>;
}

interface ConversationData {
  messages: ConversationMessage[];
  conversation_id?: string;
  title?: string;
  created_at?: string | number;
  updated_at?: string | number;
  metadata?: Record<string, any>;
}

function validateMessage(message: any, index: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if message is an object
  if (!message || typeof message !== 'object') {
    errors.push(`Message at index ${index}: Must be an object`);
    return { isValid: false, errors };
  }

  // Validate role
  if (!message.role || typeof message.role !== 'string') {
    errors.push(`Message at index ${index}: Missing or invalid 'role' field`);
  } else if (!['user', 'assistant', 'system'].includes(message.role)) {
    errors.push(`Message at index ${index}: Invalid role '${message.role}'. Must be 'user', 'assistant', or 'system'`);
  }

  // Validate content
  if (!message.content || typeof message.content !== 'string') {
    errors.push(`Message at index ${index}: Missing or invalid 'content' field`);
  } else if (message.content.trim().length === 0) {
    errors.push(`Message at index ${index}: Content cannot be empty`);
  } else if (message.content.length > 100000) {
    errors.push(`Message at index ${index}: Content too long (max 100,000 characters)`);
  }

  // Validate timestamp if present
  if (message.timestamp !== undefined) {
    const timestamp = message.timestamp;
    if (typeof timestamp === 'string') {
      const parsedDate = new Date(timestamp);
      if (isNaN(parsedDate.getTime())) {
        errors.push(`Message at index ${index}: Invalid timestamp format`);
      }
    } else if (typeof timestamp === 'number') {
      if (timestamp < 0 || timestamp > Date.now() + 86400000) { // Allow future dates up to 1 day
        errors.push(`Message at index ${index}: Timestamp out of valid range`);
      }
    } else {
      errors.push(`Message at index ${index}: Timestamp must be a string or number`);
    }
  }

  // Validate id if present
  if (message.id !== undefined && (typeof message.id !== 'string' || message.id.trim().length === 0)) {
    errors.push(`Message at index ${index}: ID must be a non-empty string`);
  }

  // Validate metadata if present
  if (message.metadata !== undefined && (typeof message.metadata !== 'object' || Array.isArray(message.metadata))) {
    errors.push(`Message at index ${index}: Metadata must be an object`);
  }

  return { isValid: errors.length === 0, errors };
}

function validateConversationData(conversationData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if conversationData is an object
  if (!conversationData || typeof conversationData !== 'object' || Array.isArray(conversationData)) {
    errors.push('Conversation data must be an object');
    return { isValid: false, errors };
  }

  // Validate messages array
  if (!conversationData.messages) {
    errors.push('Missing messages array');
    return { isValid: false, errors };
  }

  if (!Array.isArray(conversationData.messages)) {
    errors.push('Messages must be an array');
    return { isValid: false, errors };
  }

  if (conversationData.messages.length === 0) {
    errors.push('Messages array cannot be empty');
    return { isValid: false, errors };
  }

  if (conversationData.messages.length > 1000) {
    errors.push('Too many messages (max 1000)');
  }

  // Validate each message
  conversationData.messages.forEach((message: any, index: number) => {
    const messageValidation = validateMessage(message, index);
    errors.push(...messageValidation.errors);
  });

  // Validate optional fields
  if (conversationData.conversation_id !== undefined && 
      (typeof conversationData.conversation_id !== 'string' || conversationData.conversation_id.trim().length === 0)) {
    errors.push('conversation_id must be a non-empty string');
  }

  if (conversationData.title !== undefined && 
      (typeof conversationData.title !== 'string' || conversationData.title.length > 500)) {
    errors.push('Title must be a string with max 500 characters');
  }

  // Validate timestamps if present
  ['created_at', 'updated_at'].forEach(field => {
    if (conversationData[field] !== undefined) {
      const timestamp = conversationData[field];
      if (typeof timestamp === 'string') {
        const parsedDate = new Date(timestamp);
        if (isNaN(parsedDate.getTime())) {
          errors.push(`Invalid ${field} timestamp format`);
        }
      } else if (typeof timestamp === 'number') {
        if (timestamp < 0 || timestamp > Date.now() + 86400000) {
          errors.push(`${field} timestamp out of valid range`);
        }
      } else {
        errors.push(`${field} must be a string or number`);
      }
    }
  });

  // Validate metadata if present
  if (conversationData.metadata !== undefined && 
      (typeof conversationData.metadata !== 'object' || Array.isArray(conversationData.metadata))) {
    errors.push('Metadata must be an object');
  }

  return { isValid: errors.length === 0, errors };
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[${requestId}] Persona trace extraction request started`, {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  });

  try {
    // Authenticate request
    console.log(`🔐 [${requestId}] Authenticating request`);
    const authHeader = request.headers.get('Authorization');
    const authResult = authenticateRequest(authHeader);
    
    // Check if authentication failed
    if ('error' in authResult) {
      console.warn(`❌ [${requestId}] ${authResult.error}`);
      return NextResponse.json(authResult, { status: 401 });
    }
    
    const { apiKey, userId } = authResult;
    console.log(`✅ [${requestId}] Authentication successful for user: ${userId}`);

    console.log(`📥 [${requestId}] Parsing request body`);
    const body = await request.json();
    const { conversationId, conversationData, forceReprocess = false } = body;

    console.log(`📋 [${requestId}] Request payload validation`, {
      hasConversationId: !!conversationId,
      hasConversationData: !!conversationData,
      forceReprocess,
      messageCount: conversationData?.messages?.length || 0,
      conversationDataSize: JSON.stringify(conversationData || {}).length,
      conversationDataKeys: conversationData ? Object.keys(conversationData) : []
    });

    // Basic required field validation
    if (!conversationId || !conversationData) {
      console.warn(`❌ [${requestId}] Invalid request: Missing required fields`);
      return NextResponse.json({ error: 'conversationId and conversationData are required' }, { status: 400 });
    }

    // Validate conversationId format
    if (typeof conversationId !== 'string' || conversationId.trim().length === 0) {
      console.warn(`❌ [${requestId}] Invalid conversationId: Must be a non-empty string`);
      return NextResponse.json({ error: 'conversationId must be a non-empty string' }, { status: 400 });
    }

    // Comprehensive conversation data validation
    console.log(`🔍 [${requestId}] Performing comprehensive conversation data validation`);
    const validationResult = validateConversationData(conversationData);
    
    if (!validationResult.isValid) {
      console.warn(`❌ [${requestId}] Conversation data validation failed`, {
        errors: validationResult.errors,
        errorCount: validationResult.errors.length
      });
      return NextResponse.json({ 
        error: 'Invalid conversation data', 
        details: validationResult.errors,
        validation_failed: true
      }, { status: 400 });
    }

    console.log(`✅ [${requestId}] Conversation data validation passed`, {
      messageCount: conversationData.messages.length,
      hasTimestamps: conversationData.messages.some((msg: any) => msg.timestamp),
      roles: [...new Set(conversationData.messages.map((msg: any) => msg.role))],
      avgContentLength: Math.round(conversationData.messages.reduce((sum: number, msg: any) => sum + (msg.content?.length || 0), 0) / conversationData.messages.length)
    });

    // Use authenticated user ID from API key
    const user_id = userId;

    console.debug(`[${requestId}] Starting trace extraction`, {
      user_id: user_id,
      conversationId,
      forceReprocess,
      messageCount: conversationData.messages?.length || 0
    });

    // Transform conversation data to match backend expectations
    const transformedConversationData = {
      messages: conversationData.messages || [],
      conversation_id: conversationId
    };

    console.log(`🔄 [${requestId}] Transformed conversation data`, {
      originalKeys: Object.keys(conversationData),
      transformedKeys: Object.keys(transformedConversationData),
      messagesCount: transformedConversationData.messages.length,
      sampleMessage: transformedConversationData.messages[0] ? {
        role: transformedConversationData.messages[0].role,
        contentLength: transformedConversationData.messages[0].content?.length || 0,
        hasTimestamp: !!transformedConversationData.messages[0].timestamp
      } : null
    });

    // Prepare the request body for the backend
    const backendRequestBody = {
      user_id,
      conversation_data: transformedConversationData,
      session_id: conversationId,
      force_reprocess: forceReprocess
    };

    console.debug(`📤 [${requestId}] Sending trace extraction request to backend`, {
      url: `${BACKEND_URL}/api/v1/persona-crystallization/extract-traces`,
      bodySize: JSON.stringify(backendRequestBody).length,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer [REDACTED]' }
    });

    const backendStartTime = Date.now();

    // Call the backend trace extraction endpoint
    const response = await fetch(`${BACKEND_URL}/api/v1/persona-crystallization/extract-traces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(backendRequestBody)
    });

    const backendDuration = Date.now() - backendStartTime;

    console.log(`📥 [${requestId}] Backend response received`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      backendDuration_ms: backendDuration
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [${requestId}] Backend trace extraction failed with status: ${response.status}`, {
        status: response.status,
        statusText: response.statusText,
        errorText,
        backendDuration_ms: backendDuration
      });
      throw new Error(`Agent 1 backend error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    console.debug(`[${requestId}] Backend trace extraction response`, {
      tracesCount: data.traces?.length || 0,
      processingTime: data.processing_time_ms || 0
    });

    const totalDuration = Date.now() - startTime;
    console.info(`[${requestId}] Trace extraction completed successfully`, {
      duration_ms: totalDuration,
      traces_extracted: data.traces?.length || 0
    });

    // Return the trace extraction result
    const responseData = {
      traces: data.traces || [],
      extraction_metadata: data.extraction_metadata || {},
      processing_time_ms: data.processing_time_ms || totalDuration,
      metadata: {
        request_id: requestId,
        processing_time_ms: totalDuration
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[${requestId}] Trace extraction failed`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration_ms: totalDuration,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      traces: [],
      extraction_metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      processing_time_ms: 0,
      metadata: {
        request_id: requestId,
        processing_time_ms: totalDuration
      }
    }, { status: 500 });
  }
}
