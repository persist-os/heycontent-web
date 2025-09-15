import { getApiKey } from './api-helpers';
import { validateBackendUrl as validateBackendUrlConfig, getValidatedConfig } from '../../lib/config-validation';

const config = getValidatedConfig();
const BACKEND_URL = config.backendUrl;
const FRONTEND_URL = config.frontendUrl;

// Validate backend URL configuration
function validateBackendUrl(): string {
  const validation = validateBackendUrlConfig();
  if (!validation.isValid) {
    throw new Error(validation.error!);
  }
  return validation.url!;
}

export interface TraceExtractionRequest {
  userId: string;
  conversationId: string;
  conversationData: any;
}

export interface CrystallizationRequest {
  userId: string;
  traceIds: string[];
  minConfidence?: number;
}

export interface PersonaHealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  message?: string;
  endpoints?: EndpointHealthStatus[];
  overall_response_time?: number;
  backend_url?: string;
}

export interface EndpointHealthStatus {
  endpoint: string;
  status: 'healthy' | 'unhealthy';
  response_time_ms?: number;
  error?: string;
  last_checked?: string;
}

/**
 * Call the trace extraction API endpoint with proper authentication
 * 
 * Note: This function calls the frontend API route which then proxies to the backend.
 * This maintains consistency with the existing application architecture.
 */
export async function extractTraces(request: TraceExtractionRequest): Promise<any> {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  const traceExtractionEndpoint = `${FRONTEND_URL}/api/persona/trace-extraction`;
  
  console.log(`🔍 [PERSONA-API:${requestId}] Starting trace extraction`, {
    userId: request.userId,
    conversationId: request.conversationId,
    timestamp: new Date().toISOString(),
    requestUrl: traceExtractionEndpoint
  });

  const apiKey = await getApiKey();
  
  if (!apiKey) {
    console.error(`❌ [PERSONA-API:${requestId}] No API key available for authentication`);
    throw new Error('No API key available for authentication');
  }

  console.log(`🔑 [PERSONA-API:${requestId}] API key obtained successfully`, {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey.length
  });

  const requestPayload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify(request),
  };

  console.log(`📤 [PERSONA-API:${requestId}] Sending request to trace extraction endpoint`, {
    url: traceExtractionEndpoint,
    headers: { ...requestPayload.headers, Authorization: 'Bearer [REDACTED]' },
    bodySize: requestPayload.body.length
  });

  const response = await fetch(traceExtractionEndpoint, requestPayload);

  const duration = Date.now() - startTime;
  
  console.log(`📥 [PERSONA-API:${requestId}] Received response from trace extraction`, {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    duration_ms: duration
  });

  if (!response.ok) {
    let errorData: any = { error: 'Unknown error' };
    const responseText = await response.text().catch(() => '');
    
    try {
      if (responseText) {
        errorData = JSON.parse(responseText);
      }
    } catch (parseError) {
      // If JSON parsing fails, use the raw text
      errorData = { error: responseText || 'Failed to parse error response' };
    }
    
    console.error(`❌ [PERSONA-API:${requestId}] Trace extraction failed`, {
      status: response.status,
      statusText: response.statusText,
      errorData,
      responseText: responseText.substring(0, 500), // Log first 500 chars of response
      duration_ms: duration
    });
    
    const errorMessage = errorData.detail || errorData.error || response.statusText || 'Unknown error';
    throw new Error(`Trace extraction failed (${response.status}): ${errorMessage}`);
  }

  const result = await response.json();
  
  console.log(`✅ [PERSONA-API:${requestId}] Trace extraction completed successfully`, {
    tracesCount: result.traces?.length || 0,
    duration_ms: duration,
    hasMetadata: !!result.extraction_metadata,
    processingTime: result.processing_time_ms
  });

  return result;
}

/**
 * Call the crystallization API endpoint with proper authentication and retry logic
 */
export async function crystallizeInsights(request: CrystallizationRequest): Promise<any> {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  const backendUrl = validateBackendUrl();
  const crystallizationEndpoint = `${backendUrl}/api/v1/persona-crystallization/crystallize-insights`;
  
  console.log(`🔮 [PERSONA-API:${requestId}] Starting insight crystallization`, {
    userId: request.userId,
    traceIdsCount: request.traceIds.length,
    minConfidence: request.minConfidence,
    timestamp: new Date().toISOString(),
    requestUrl: crystallizationEndpoint,
    backendUrl: backendUrl
  });

  const apiKey = await getApiKey();
  
  if (!apiKey) {
    console.error(`❌ [PERSONA-API:${requestId}] No API key available for authentication`);
    throw new Error('No API key available for authentication');
  }

  console.log(`🔑 [PERSONA-API:${requestId}] API key obtained successfully`, {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey.length
  });

  // Convert frontend request format to backend format
  const backendRequest = {
    user_id: request.userId,
    trace_ids: request.traceIds || [],
    min_confidence: request.minConfidence || 0.6
  };

  const requestPayload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify(backendRequest),
  };

  console.log(`📤 [PERSONA-API:${requestId}] Sending request to crystallization endpoint`, {
    url: crystallizationEndpoint,
    headers: { ...requestPayload.headers, Authorization: 'Bearer [REDACTED]' },
    bodySize: requestPayload.body.length,
    requestData: { ...backendRequest, trace_ids: `[${backendRequest.trace_ids.length} traces]` }
  });

  // Implement retry logic
  let lastError: Error | null = null;
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(crystallizationEndpoint, requestPayload);
      const duration = Date.now() - startTime;
      
      console.log(`📥 [PERSONA-API:${requestId}] Received response from crystallization (attempt ${attempt})`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration_ms: duration,
        attempt: attempt
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const error = new Error(`Crystallization failed (${response.status}): ${errorData.error || response.statusText}`);
        
        // Don't retry for client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          console.error(`❌ [PERSONA-API:${requestId}] Client error - no retry`, {
            status: response.status,
            statusText: response.statusText,
            errorData,
            duration_ms: duration
          });
          throw error;
        }
        
        // Retry for server errors (5xx) or network issues
        if (attempt === maxRetries) {
          console.error(`❌ [PERSONA-API:${requestId}] Max retries exceeded`, {
            status: response.status,
            statusText: response.statusText,
            errorData,
            duration_ms: duration,
            attempts: attempt
          });
          throw error;
        }
        
        console.warn(`⚠️ [PERSONA-API:${requestId}] Retry ${attempt}/${maxRetries} after error`, {
          status: response.status,
          error: errorData.error,
          nextRetryIn: baseDelay * attempt
        });
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, baseDelay * attempt));
        continue;
      }

      const result = await response.json();
      
      console.log(`✅ [PERSONA-API:${requestId}] Crystallization completed successfully`, {
        insightsCount: result.insights?.length || 0,
        duration_ms: duration,
        hasMetadata: !!result.crystallization_metadata,
        attempt: attempt,
        processingTime: result.processing_time_ms
      });

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        console.error(`❌ [PERSONA-API:${requestId}] Final attempt failed`, {
          error: lastError.message,
          duration_ms: Date.now() - startTime,
          attempts: attempt
        });
        throw lastError;
      }
      
      console.warn(`⚠️ [PERSONA-API:${requestId}] Network error - retry ${attempt}/${maxRetries}`, {
        error: lastError.message,
        nextRetryIn: baseDelay * attempt
      });
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, baseDelay * attempt));
    }
  }
  
  throw lastError || new Error('Unknown error during crystallization');
}

/**
 * Check the health of the persona backend service with detailed endpoint validation
 */
export async function checkPersonaHealth(): Promise<PersonaHealthCheck> {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  console.log(`🏥 [PERSONA-HEALTH:${requestId}] Starting comprehensive health check`, {
    timestamp: new Date().toISOString()
  });

  try {
    const backendUrl = validateBackendUrl();
    const apiKey = await getApiKey();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Add API key if available (optional for health check)
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    console.log(`🔍 [PERSONA-HEALTH:${requestId}] Testing persona backend health`, {
      backendUrl: backendUrl,
      hasApiKey: !!apiKey
    });

    // Define endpoints to check
    const endpointsToCheck = [
      {
        name: 'persona-crystallization-health',
        url: `${backendUrl}/api/v1/persona-crystallization/health`,
        method: 'GET' as const,
        requiresAuth: false
      },
      {
        name: 'persona-general-health', 
        url: `${backendUrl}/api/v1/persona/health`,
        method: 'GET' as const,
        requiresAuth: false
      }
    ];

    const endpointResults: EndpointHealthStatus[] = [];
    let allHealthy = true;

    // Check each endpoint
    for (const endpoint of endpointsToCheck) {
      const endpointStart = Date.now();
      
      try {
        console.log(`🔍 [PERSONA-HEALTH:${requestId}] Testing endpoint: ${endpoint.name}`);
        
        const endpointHeaders = { ...headers };
        if (!endpoint.requiresAuth) {
          delete endpointHeaders['Authorization'];
        }

        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: endpointHeaders,
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        const responseTime = Date.now() - endpointStart;
        
        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          endpointResults.push({
            endpoint: endpoint.name,
            status: 'healthy',
            response_time_ms: responseTime,
            last_checked: new Date().toISOString()
          });
          
          console.log(`✅ [PERSONA-HEALTH:${requestId}] Endpoint ${endpoint.name} healthy`, {
            response_time_ms: responseTime,
            status: response.status
          });
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          endpointResults.push({
            endpoint: endpoint.name,
            status: 'unhealthy',
            response_time_ms: responseTime,
            error: `HTTP ${response.status}: ${errorData.error || response.statusText}`,
            last_checked: new Date().toISOString()
          });
          allHealthy = false;
          
          console.warn(`⚠️ [PERSONA-HEALTH:${requestId}] Endpoint ${endpoint.name} unhealthy`, {
            status: response.status,
            error: errorData.error,
            response_time_ms: responseTime
          });
        }
      } catch (error) {
        const responseTime = Date.now() - endpointStart;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        endpointResults.push({
          endpoint: endpoint.name,
          status: 'unhealthy',
          response_time_ms: responseTime,
          error: errorMessage,
          last_checked: new Date().toISOString()
        });
        allHealthy = false;
        
        console.error(`❌ [PERSONA-HEALTH:${requestId}] Endpoint ${endpoint.name} failed`, {
          error: errorMessage,
          response_time_ms: responseTime
        });
      }
    }

    const totalTime = Date.now() - startTime;
    const healthStatus: PersonaHealthCheck = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      message: allHealthy 
        ? 'All persona crystallization endpoints are healthy'
        : 'Some persona crystallization endpoints are unhealthy',
      endpoints: endpointResults,
      overall_response_time: totalTime,
      backend_url: backendUrl
    };

    console.log(`🏥 [PERSONA-HEALTH:${requestId}] Health check completed`, {
      overall_status: healthStatus.status,
      total_time_ms: totalTime,
      endpoints_checked: endpointResults.length,
      healthy_endpoints: endpointResults.filter(e => e.status === 'healthy').length
    });

    return healthStatus;
  } catch (error) {
    const totalTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`❌ [PERSONA-HEALTH:${requestId}] Health check failed`, {
      error: errorMessage,
      total_time_ms: totalTime
    });

    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      message: `Health check failed: ${errorMessage}`,
      overall_response_time: totalTime,
      endpoints: []
    };
  }
}

/**
 * Utility function to trigger trace extraction for a conversation
 * This is meant to be called from frontend components or other frontend utilities
 */
export async function triggerConversationTraceExtraction(
  userId: string,
  conversationId: string,
  conversationData: any
): Promise<any> {
  const utilityId = Math.random().toString(36).substring(7);
  console.log(`🎯 [PERSONA-UTILITY:${utilityId}] triggerConversationTraceExtraction called`, {
    userId,
    conversationId,
    hasConversationData: !!conversationData,
    messageCount: conversationData?.messages?.length || 0,
    timestamp: new Date().toISOString()
  });
  
  try {
    const result = await extractTraces({
      userId,
      conversationId,
      conversationData,
    });
    
    console.log('✅ [PERSONA API] Trace extraction completed successfully');
    return result;
  } catch (error) {
    console.error('❌ [PERSONA API] Trace extraction failed:', error);
    throw error;
  }
}

/**
 * Utility function to trigger insight crystallization for a user
 */
export async function triggerInsightCrystallization(
  userId: string,
  traceIds: string[],
  minConfidence: number = 0.6
): Promise<any> {
  console.log('🔮 [PERSONA API] Triggering insight crystallization for user:', userId);
  
  try {
    const result = await crystallizeInsights({
      userId,
      traceIds,
      minConfidence,
    });
    
    console.log('✅ [PERSONA API] Insight crystallization completed successfully');
    return result;
  } catch (error) {
    console.error('❌ [PERSONA API] Insight crystallization failed:', error);
    throw error;
  }
}
