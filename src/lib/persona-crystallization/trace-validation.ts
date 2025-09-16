/**
 * Trace ID validation utilities for persona crystallization
 * 
 * This module provides validation functions for trace IDs to ensure they match
 * the exact backend generation format before being used in crystallization operations.
 */

/**
 * Validate trace IDs format and content to match exact backend generation format.
 * 
 * Expected formats:
 * - Extracted traces: trace_{timestamp_ms}_{user_hash}_{unique_id}
 *   - timestamp_ms: 13-digit Unix timestamp in milliseconds
 *   - user_hash: 8-character hexadecimal string (a-f0-9)
 *   - unique_id: 8-character hexadecimal string (a-f0-9)
 * - Manual traces: manual_{timestamp}_{random_string}
 *   - timestamp: Unix timestamp (10-13 digits)
 *   - random_string: alphanumeric string
 */
export function validateTraceIds(traceIds: string[]): boolean {
  if (!Array.isArray(traceIds)) {
    console.warn('Invalid trace IDs: not an array');
    return false;
  }
  
  // Empty arrays are valid - they indicate all-traces crystallization
  if (traceIds.length === 0) {
    return true;
  }

  for (const traceId of traceIds) {
    if (typeof traceId !== 'string' || traceId.trim().length === 0) {
      console.warn(`Invalid trace ID: not a string or empty - ${traceId}`);
      return false;
    }
    
    // Validate extracted trace format (matches backend _generate_trace_id)
    // Pattern: trace_ + 10 digits + _ + 8 hex chars + _ + 8 hex chars  
    const isValidExtractedTrace = /^trace_\d{10}_[a-f0-9]{8}_[a-f0-9]{8}$/.test(traceId);
    
    // Validate manual trace format (legacy support)
    // Pattern: manual_ + timestamp + _ + alphanumeric string
    const isValidManualTrace = /^manual_\d{10,13}_[a-zA-Z0-9]+$/.test(traceId);
    
    if (!isValidExtractedTrace && !isValidManualTrace) {
      console.warn(`Invalid trace ID format: ${traceId}. Expected formats:
        - Extracted: trace_{10-digit-timestamp}_{8-hex-chars}_{8-hex-chars}
        - Manual: manual_{timestamp}_{alphanumeric}`);
      return false;
    }
  }

  return true;
}

/**
 * Extract trace IDs from extraction result
 */
export function extractTraceIds(extractionResult: any): string[] {
  if (!extractionResult?.traces || !Array.isArray(extractionResult.traces)) {
    return [];
  }

  const traceIds = extractionResult.traces
    .map((trace: any) => trace.trace_id || trace.id)
    .filter((id: any) => typeof id === 'string' && id.trim().length > 0);

  console.log('🔍 [TRACE-ID-EXTRACTION] Extracted trace IDs', {
    totalTraces: extractionResult.traces.length,
    validTraceIds: traceIds.length,
    traceIds: traceIds.slice(0, 3) // Log first 3 for debugging
  });

  return traceIds;
}

/**
 * Clean traces by removing convex_id field that's not needed for storage
 */
export function cleanTracesForStorage(traces: any[]): any[] {
  return traces.map((trace: any) => {
    const { convex_id, ...cleanTrace } = trace;
    return cleanTrace;
  });
}
