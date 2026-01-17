import { NextResponse } from 'next/server';

// Helper to extract Bearer token from Authorization header
export function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}

// Helper to extract userId from heycontext API key: 'heycontext_userid_suffix'
export function getUserIdFromApiKey(apiKey: string): string | null {
  // Example: 'heycontext_12345_abcd'
  const parts = apiKey.split('_');
  if (parts.length >= 3 && parts[0] === 'heycontext') {
    return parts[1];
  }
  return null;
}


// Helper to send standardized error response
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Helper to send standardized success response
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

// Logging helper (can be expanded)
export function logRequest(requestId: string, message: string, meta?: any) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${requestId}] ${message}`, meta || '');
  }
}
