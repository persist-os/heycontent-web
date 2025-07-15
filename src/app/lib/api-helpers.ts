'use client';

import { getFirebaseAuth } from '@/app/lib/firebase';
import { getValidToken, isTokenExpired } from '@/app/lib/firebase-token-manager';
import Cookies from 'js-cookie';
import { AuthenticationError, ServiceUnavailableError, APIError } from './errors';

/**
 * Get API key from cookies or request a new one
 */
export async function getApiKey(): Promise<string | null> {
  let needsRefresh = false;
  try {
    const storedApiKey = Cookies.get('apiKey');
    let auth = null;
    try {
      auth = getFirebaseAuth();
    } catch (e) {
      // Silently handle auth unavailable - don't spam console
      if (process.env.NODE_ENV === 'development') {
        console.warn('getFirebaseAuth() failed:', e);
      }
      throw new AuthenticationError('Firebase Auth not available');
    }
    if (storedApiKey) {
      const apiKey = JSON.parse(storedApiKey);
      // Check for invalid/temporary key
      const isValid = (typeof apiKey === 'string' && !apiKey.endsWith('_temporary'));
      // Check if the key matches the current user
      let userMatches = false;
      let keyUserId = null, firebaseUserId = null;
      if (isValid && auth && auth.currentUser) {
        // Extract userId from the API key (assuming format: heycontent_<userId>_...)
        const keyParts = apiKey.split('_');
        if (keyParts.length >= 3) {
          keyUserId = keyParts[1];
          firebaseUserId = auth.currentUser.uid;
          userMatches = keyUserId === firebaseUserId;
        }
      }
      // Only remove the API key if we are sure the user does not match
      if (!isValid || (auth && auth.currentUser && !userMatches)) {
        if (process.env.NODE_ENV === 'development') {
          console.info('[api-helpers] API key in cookies did not match current user or is invalid. Removing and refreshing...');
        }
        Cookies.remove('apiKey');
        needsRefresh = true;
      } else if (isValid && auth && !auth.currentUser) {
        // If the Firebase user is not yet loaded, do not remove the API key, just return null and try again later
        if (process.env.NODE_ENV === 'development') {
          console.info('[api-helpers] Firebase user not loaded yet. Skipping API key validation for now.');
        }
        return null;
      } else {
        // Valid key found for current user
        return apiKey;
      }
    } else {
      needsRefresh = true;
    }

    // If no valid API key and we have a Firebase user, request one from the backend
    if (needsRefresh && auth && auth.currentUser) {
      const userId = auth.currentUser.uid;
      try {
        // Get a fresh Firebase ID token using the enhanced token manager
        const idToken = await getValidToken(auth.currentUser);
        // Request an API key via our API proxy to avoid CSP issues
        const response = await fetch('/api/auth/key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            idToken,
            userId: userId,
            action: 'refresh'
          }),
        });
        if (response.ok) {
          const data = await response.json();
          let apiKeyValue = data.apiKey;
          // Accept key from data.data.key if present (backend returns this structure)
          if (!apiKeyValue && data.data && typeof data.data.key === 'string') {
            apiKeyValue = data.data.key;
          }
          if (typeof apiKeyValue === 'string' && apiKeyValue.startsWith('heycontent_') && !apiKeyValue.endsWith('_temporary')) {
            Cookies.set('apiKey', JSON.stringify(apiKeyValue), { expires: 7, sameSite: 'Lax', secure: process.env.NODE_ENV === 'production', path: '/' });
            return apiKeyValue;
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Received invalid or temporary API key from backend:', apiKeyValue);
            }
            Cookies.remove('apiKey');
            throw new AuthenticationError('Invalid or temporary API key received');
          }
        } else {
          if (response.status === 401 || response.status === 403) {
            throw new AuthenticationError('Token expired or invalid');
          } else if (response.status >= 500) {
            throw new ServiceUnavailableError('Backend service unavailable');
          } else {
            throw new APIError('Failed to get API key');
          }
        }
      } catch (apiError) {
        if (apiError instanceof AuthenticationError || apiError instanceof ServiceUnavailableError || apiError instanceof APIError) {
          throw apiError;
        }
        if (process.env.NODE_ENV === 'development') {
          console.error('Error requesting API key from backend:', apiError);
        }
        throw new APIError('Error requesting API key from backend');
      }
    }
    return null;
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ServiceUnavailableError || error instanceof APIError) {
      throw error;
    }
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting API key:', error);
    }
    throw new APIError('No valid API key available. Please contact support.');
  }
}

/**
 * Get the current user ID from API key stored in cookies
 */
export function getCurrentUserId(): string | null {
  // Get user ID directly from API key in cookies
  const apiKey = Cookies.get('apiKey');
  if (apiKey) {
    try {
      const parsedApiKey = JSON.parse(apiKey);
      const keyParts = parsedApiKey.split('_');
      if (keyParts.length >= 3) {
        return keyParts[1];
      }
    } catch (e) {
      // If parsing fails, try using the raw value
      const keyParts = apiKey.split('_');
      if (keyParts.length >= 3) {
        return keyParts[1];
      }
    }
  }
  return null;
}

/**
 * Helper function to make authenticated API requests
 * Automatically adds the Firebase ID token to the request headers
 * Now includes automatic token refresh and expiration checking
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  try {
    // Get the current user
    let user;
    try {
      user = getFirebaseAuth().currentUser;
    } catch (e) {
      console.warn('getFirebaseAuth() failed:', e);
      throw new Error('Firebase Auth not available');
    }

    if (!user) {
      console.error('fetchWithAuth: No authenticated user found');
      throw new Error('User not authenticated');
    }

    // Get a valid token (this will automatically refresh if needed)
    const token = await getValidToken(user);

    // Create headers with Authorization
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Make the request with the token
    const response = await fetch(url, {
      ...options,
      headers,
      // Add credentials: 'include' to ensure cookies are sent with the request
      credentials: 'include'
    });

    // Check if the response indicates an authentication error
    if (response.status === 401 || response.status === 403) {
      console.warn('Authentication error in API response, attempting token refresh...');
      try {
        // Force refresh the token
        const refreshedToken = await getValidToken(user);
        const retryHeaders = {
          ...options.headers,
          'Authorization': `Bearer ${refreshedToken}`,
          'Content-Type': 'application/json',
        };
        const retryResponse = await fetch(url, {
          ...options,
          headers: retryHeaders,
          credentials: 'include'
        });
        if (retryResponse.status === 401 || retryResponse.status === 403) {
          throw new AuthenticationError('Token expired or invalid');
        }
        console.log('Request retried with refreshed token');
        return retryResponse;
      } catch (refreshError) {
        console.error('Token refresh failed during API retry:', refreshError);
        throw new AuthenticationError('Authentication failed. Please sign in again.');
      }
    }

    return response;
  } catch (error) {
    console.error('Error in fetchWithAuth:', error);
    throw error;
  }
}

export async function fetchWithApiKey(url: string, options: RequestInit = {}): Promise<Response> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new AuthenticationError('No API key found. Please log in again.');
  const headers = {
    ...(options.headers || {}),
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  const response = await fetch(url, {
    ...options,
    headers,
  });
  if (response.status === 401 || response.status === 403) {
    throw new AuthenticationError('Token expired or invalid');
  }
  return response;
}
