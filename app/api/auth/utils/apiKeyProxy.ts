import { NextResponse } from 'next/server';

import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Proxy an API key request to the backend, given a Firebase idToken and userId.
 * Handles error parsing and response formatting.
 * Returns the backend's JSON response or a formatted error.
 */
export async function proxyApiKeyRequest({ idToken, userId }: { idToken: string; userId: string }) {
  console.log('[proxyApiKeyRequest] called with:', { userId, hasIdToken: !!idToken });
  if (idToken) {
    const preview = `${idToken.substring(0, 10)}...${idToken.substring(idToken.length - 5)}`;
    console.log('[proxyApiKeyRequest] idToken preview:', preview, 'length:', idToken.length);
  }
  if (!idToken) {
    console.warn('[proxyApiKeyRequest] Missing idToken');
    return {
      error: 'ID Token is required',
      status: 400,
    };
  }

  console.log('[proxyApiKeyRequest] Sending request to backend', {
    url: `${BACKEND_URL}/api/v1/api-keys/`,
    userId,
  });
  const backendRes = await fetch(`${BACKEND_URL}/api/v1/api-keys/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ userId }),
  });

  if (!backendRes.ok) {
    const errorText = await backendRes.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText || 'Unknown error' };
    }
    console.error('[proxyApiKeyRequest] Backend responded with error', {
      status: backendRes.status,
      errorData,
    });
    return {
      error: errorData.message || `Backend responded with status: ${backendRes.status}`,
      details: errorData,
      status: backendRes.status,
    };
  }

  const data = await backendRes.json();
  console.log('[proxyApiKeyRequest] Success, backend returned:', data);
  return data;
}
