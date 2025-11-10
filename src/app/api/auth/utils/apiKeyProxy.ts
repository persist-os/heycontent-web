import { NextResponse } from 'next/server';

import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Proxy an API key request to the backend, given a Firebase idToken and userId.
 * Handles error parsing and response formatting.
 * Returns the backend's JSON response or a formatted error.
 */
export async function proxyApiKeyRequest({ idToken, userId, clientType = 'web' }: { idToken: string; userId: string; clientType?: string }) {
  if (!idToken) {
    return {
      error: 'ID Token is required',
      status: 400,
    };
  }

  const backendUrl = `${BACKEND_URL}/api/v1/api-keys/`;
  const payload = { userId, clientType };
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
    return {
      error: 'Failed to reach backend',
      details: fetchErr instanceof Error ? fetchErr.message : fetchErr,
      status: 502,
    };
  }

  let responseBodyText;
  try {
    responseBodyText = await backendRes.text();
  } catch (bodyErr) {
    responseBodyText = '[unreadable]';
  }

  if (!backendRes.ok) {
    let errorData;
    try {
      errorData = JSON.parse(responseBodyText);
    } catch {
      errorData = { message: responseBodyText || 'Unknown error' };
    }
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
    return {
      error: 'Backend returned invalid JSON',
      details: responseBodyText,
      status: backendRes.status,
    };
  }
  return data;
}
