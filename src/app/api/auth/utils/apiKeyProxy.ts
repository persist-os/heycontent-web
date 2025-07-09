import { NextResponse } from 'next/server';

import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

console.log('[apiKeyProxy] NEXT_PUBLIC_BACKEND_URL:', BACKEND_URL);

/**
 * Proxy an API key request to the backend, given a Firebase idToken and userId.
 * Handles error parsing and response formatting.
 * Returns the backend's JSON response or a formatted error.
 */
export async function proxyApiKeyRequest({ idToken, userId, clientType = 'web' }: { idToken: string; userId: string; clientType?: string }) {
  console.log('[proxyApiKeyRequest] called with:', { userId, hasIdToken: !!idToken, clientType });
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

  const backendUrl = `${BACKEND_URL}/api/v1/api-keys/`;
  const payload = { userId, clientType };
  console.log('[proxyApiKeyRequest] Sending request to backend', {
    url: backendUrl,
    userId,
    clientType,
    payload,
  });
  let backendRes;
  try {
    backendRes = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (fetchErr) {
    console.error('[proxyApiKeyRequest] Fetch to backend failed:', fetchErr);
    return {
      error: 'Failed to reach backend',
      details: fetchErr instanceof Error ? fetchErr.message : fetchErr,
      status: 502,
    };
  }

  // Log status and headers
  console.log('[proxyApiKeyRequest] Backend response status:', backendRes.status);
  console.log('[proxyApiKeyRequest] Backend response headers:', Object.fromEntries(backendRes.headers.entries()));

  let responseBodyText;
  try {
    responseBodyText = await backendRes.text();
    console.log('[proxyApiKeyRequest] Backend response body:', responseBodyText);
  } catch (bodyErr) {
    console.error('[proxyApiKeyRequest] Failed to read backend response body:', bodyErr);
    responseBodyText = '[unreadable]';
  }

  if (!backendRes.ok) {
    let errorData;
    try {
      errorData = JSON.parse(responseBodyText);
    } catch {
      errorData = { message: responseBodyText || 'Unknown error' };
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

  let data;
  try {
    data = JSON.parse(responseBodyText);
  } catch (jsonErr) {
    console.error('[proxyApiKeyRequest] Failed to parse backend response as JSON:', jsonErr);
    return {
      error: 'Backend returned invalid JSON',
      details: responseBodyText,
      status: backendRes.status,
    };
  }
  console.log('[proxyApiKeyRequest] Success, backend returned:', data);
  return data;
}
