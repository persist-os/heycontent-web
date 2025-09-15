/**
 * Server-side API helper functions
 * IMPORTANT: Do not use any browser-specific APIs here (like localStorage)
 */

/**
 * Extract API key from Authorization header
 * @param authHeader The Authorization header value
 * @returns The API key or null if not found
 */
export function extractApiKeyFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // Extract the API key from the Authorization header
  const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
  if (!apiKey) {
    return null;
  }
  
  return apiKey;
}

/**
 * Extract user ID from API key
 * @param apiKey The API key
 * @returns The user ID or null if not found
 */
export function extractUserIdFromApiKey(apiKey: string | null): string | null {
  if (!apiKey) {
    return null;
  }
  
  const apiKeyParts = apiKey.split('_');
  if (apiKeyParts.length >= 2) {
    return apiKeyParts[1];
  }
  
  return null;
}

/**
 * Extract both API key and user ID from Authorization header
 * @param authHeader The Authorization header value
 * @returns Object containing apiKey and userId, or null values if not found
 */
export function extractAuthInfo(authHeader: string | null): { apiKey: string | null; userId: string | null } {
  const apiKey = extractApiKeyFromHeader(authHeader);
  const userId = extractUserIdFromApiKey(apiKey);
  
  return { apiKey, userId };
}

/**
 * Standard authentication result type
 */
export interface AuthResult {
  apiKey: string;
  userId: string;
}

/**
 * Standard authentication error response
 */
export interface AuthError {
  error: string;
  details?: string;
}

/**
 * Authenticate request and extract user information
 * @param authHeader The Authorization header value
 * @returns AuthResult on success, AuthError on failure
 */
export function authenticateRequest(authHeader: string | null): AuthResult | AuthError {
  const { apiKey, userId } = extractAuthInfo(authHeader);
  
  if (!apiKey) {
    return {
      error: 'Authentication failed: Missing or invalid Authorization header',
      details: 'Expected format: "Bearer <api_key>" where api_key follows the format heycontent_<userId>_<randomPart>'
    };
  }
  
  if (!userId) {
    return {
      error: 'Authentication failed: Could not determine user ID from API key',
      details: 'API key must be in the format: heycontent_<userId>_<randomPart>'
    };
  }
  
  return { apiKey, userId };
}
