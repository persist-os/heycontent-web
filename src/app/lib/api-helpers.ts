'use client';

import { getFirebaseAuth } from '@/app/lib/firebase';
import { getValidToken, isTokenExpired } from '@/app/lib/firebase-token-manager';
import Cookies from 'js-cookie';
import { AuthenticationError, ServiceUnavailableError, APIError } from './errors';

// Centralized debug utilities (development-only)
const DEBUG = process.env.NODE_ENV === 'development';
const timestamp = () => new Date().toISOString();
const debugLog = {
  info: (...args: any[]) => { if (DEBUG) console.info('[api-helpers]', timestamp(), ...args); },
  log: (...args: any[]) => { if (DEBUG) console.log('[api-helpers]', timestamp(), ...args); },
  warn: (...args: any[]) => { if (DEBUG) console.warn('[api-helpers]', timestamp(), ...args); },
  error: (...args: any[]) => { if (DEBUG) console.error('[api-helpers]', timestamp(), ...args); },
};
const now = () => Date.now();
let authInitializedAt: number | null = null;
let lastAuthUid: string | null = null;

/**
 * Check if Firebase Auth is initialized and ready
 * Returns a promise that resolves when auth state is determined
 */
export function isAuthReady(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const auth = getFirebaseAuth();
      debugLog.log('isAuthReady: subscribing to onAuthStateChanged', { currentUser: Boolean(auth?.currentUser) });
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        if (authInitializedAt === null) {
          authInitializedAt = now();
          lastAuthUid = user?.uid ?? null;
          debugLog.info('Auth state transitioned to ready', { uid: lastAuthUid, readyAt: authInitializedAt });
        } else {
          debugLog.log('Auth state callback fired (already initialized)', { uid: user?.uid ?? null });
        }
        resolve(true); // Auth is ready regardless of user state
      });
    } catch (error) {
      debugLog.warn('isAuthReady: Firebase Auth not available', { error: String(error) });
      resolve(false); // Auth not available
    }
  });
}

/**
 * Wait for auth state to be ready with retry logic
 * Only retries if auth appears to be initializing (not if user is actually not signed in)
 */
export async function waitForAuthState(retries: number = 3, interval: number = 100): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const auth = getFirebaseAuth();
      debugLog.log('waitForAuthState: attempt', { attempt: i + 1, currentUser: Boolean(auth?.currentUser) });
      if (auth.currentUser !== null) {
        debugLog.info('waitForAuthState: user detected', { uid: auth.currentUser.uid });
        return auth.currentUser;
      }
      // Only wait if auth might still be initializing
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    } catch (error) {
      // Auth not available, don't retry
      debugLog.warn('waitForAuthState: auth not available, aborting retries', { error: String(error) });
      break;
    }
  }
  return null;
}

/**
 * Synchronous best-effort current userId from cookie only.
 * Returns null if not determinable synchronously.
 */
export function getCurrentUserIdSync(): string | null {
  try {
    const apiKey = Cookies.get('apiKey');
    if (!apiKey) return null;
    let keyValue: string | null = null;
    try {
      const parsed = JSON.parse(apiKey);
      if (typeof parsed === 'string') keyValue = parsed;
    } catch {
      keyValue = apiKey;
    }
    if (!keyValue) return null;
    const parts = keyValue.split('_');
    if (parts.length >= 3 && parts[0] === 'heycontent') {
      const userId = parts[1];
      return userId && userId.length > 0 ? userId : null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Wait until authentication state is ready (user determined),
 * resolving to true if ready (even if signed out), false if unavailable.
 */
export async function waitForAuthReady(retries: number = 5, interval: number = 150): Promise<boolean> {
  const ready = await isAuthReady();
  if (ready) return true;
  for (let i = 0; i < retries; i++) {
    const again = await isAuthReady();
    if (again) return true;
    if (i < retries - 1) await new Promise(r => setTimeout(r, interval));
  }
  return false;
}

/**
 * Get API key from cookies or request a new one
 */
export async function getApiKey(): Promise<string | null> {
  let needsRefresh = false;
  try {
    const storedApiKey = Cookies.get('apiKey');
    
    // Wait for auth to be ready before proceeding
    const authReady = await isAuthReady();
    if (!authReady) {
      throw new AuthenticationError('Firebase Auth not available');
    }
    
    const auth = getFirebaseAuth();
    
    if (storedApiKey) {
      const apiKey = JSON.parse(storedApiKey);
      // Check for invalid/temporary key
      const isValid = (typeof apiKey === 'string' && !apiKey.endsWith('_temporary'));
      
      // Enhanced user matching with better validation
      let userMatches = false;
      let keyUserId = null, firebaseUserId = null;
      
      if (isValid && auth.currentUser) {
        // Extract userId from the API key (assuming format: heycontent_<userId>_...)
        const keyParts = apiKey.split('_');
        if (keyParts.length >= 3 && keyParts[0] === 'heycontent') {
          keyUserId = keyParts[1];
          firebaseUserId = auth.currentUser.uid;
          userMatches = keyUserId === firebaseUserId;
        }
      }
      
      // Only remove the API key if we are sure the user does not match
      if (!isValid || (auth.currentUser && !userMatches)) {
        debugLog.info('API key mismatch or invalid, removing and refreshing');
        Cookies.remove('apiKey');
        needsRefresh = true;
      } else if (isValid && !auth.currentUser) {
        // If the Firebase user is not yet loaded, wait briefly for auth state
        const user = await waitForAuthState();
        if (user) {
          // Re-check user matching after waiting
          const keyParts = apiKey.split('_');
          if (keyParts.length >= 3 && keyParts[0] === 'heycontent') {
            const keyUserId = keyParts[1];
            const firebaseUserId = user.uid;
            if (keyUserId === firebaseUserId) {
              return apiKey;
            }
          }
          Cookies.remove('apiKey');
          needsRefresh = true;
        } else {
          return null;
        }
      } else {
        // Valid key found for current user
        return apiKey;
      }
    } else {
      needsRefresh = true;
    }

    // If no valid API key and we have a Firebase user, request one from the backend
    if (needsRefresh && auth.currentUser) {
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
            debugLog.warn('Received invalid or temporary API key from backend', { apiKeyValue });
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
        debugLog.error('Error requesting API key from backend', { error: String(apiError) });
        throw new APIError('Error requesting API key from backend');
      }
    }
    return null;
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ServiceUnavailableError || error instanceof APIError) {
      throw error;
    }
    debugLog.error('Error getting API key', { error: String(error) });
    throw new APIError('No valid API key available. Please contact support.');
  }
}

/**
 * Get the current user ID (UID) as a string.
 * Tries to extract from the API key in cookies; falls back to Firebase auth.
 * Throws AuthenticationError if a valid string user ID cannot be determined.
 */
export async function getCurrentUserId(): Promise<string> {
  const t0 = now();
  debugLog.info('getCurrentUserId: start');
  // Enhanced cookie extraction with validation
  const extractUserIdFromKey = (value: string): string | null => {
    const parts = value.split('_');
    if (parts.length >= 3 && parts[0] === 'heycontent') {
      const userId = parts[1];
      // Validate userId format (should be non-empty string)
      return userId && userId.length > 0 ? userId : null;
    }
    return null;
  };

  // Try to extract from API key cookie with improved robustness
  const apiKey = Cookies.get('apiKey');
  debugLog.log('getCurrentUserId: cookie read', { present: Boolean(apiKey), length: apiKey ? apiKey.length : 0 });
  if (apiKey) {
    // Try parsing JSON-wrapped key first
    try {
      const parsedApiKey = JSON.parse(apiKey);
      debugLog.log('getCurrentUserId: cookie JSON parse success', { type: typeof parsedApiKey });
      if (typeof parsedApiKey === 'string') {
        const fromParsed = extractUserIdFromKey(parsedApiKey);
        if (fromParsed) {
          debugLog.info('getCurrentUserId: extracted uid from parsed cookie', { uid: fromParsed, ms: now() - t0 });
          return fromParsed;
        }
      }
    } catch (_) {
      // Ignore parse errors; try raw cookie value
      debugLog.warn('getCurrentUserId: cookie JSON parse failed, trying raw value');
    }

    const fromRaw = extractUserIdFromKey(apiKey);
    if (fromRaw) {
      debugLog.info('getCurrentUserId: extracted uid from raw cookie', { uid: fromRaw, ms: now() - t0 });
      return fromRaw;
    }
  }

  // Fallback: wait for Firebase auth to be ready
  try {
    const tAuthWaitStart = now();
    const authReady = await isAuthReady();
    const waitedMs = now() - tAuthWaitStart;
    const sinceInitMs = authInitializedAt ? now() - authInitializedAt : null;
    debugLog.log('getCurrentUserId: auth readiness result', { authReady, waitedMs, sinceAuthInitializedMs: sinceInitMs });
    if (authReady) {
      const auth = getFirebaseAuth();
      debugLog.log('getCurrentUserId: auth state', { hasUser: Boolean(auth?.currentUser), uid: auth?.currentUser?.uid ?? null });
      const uid = auth?.currentUser?.uid;
      if (typeof uid === 'string' && uid.length > 0) {
        debugLog.info('getCurrentUserId: extracted uid from Firebase auth', { uid, ms: now() - t0 });
        return uid;
      }
    }
  } catch (_) {
    // Auth may be unavailable in some environments; continue to throw below
    debugLog.warn('getCurrentUserId: auth unavailable during fallback');
  }

  // Runtime contract: must return string UID
  debugLog.error('getCurrentUserId: failed to determine uid', { ms: now() - t0 });
  throw new AuthenticationError('User identification required. Please sign in again!');
}

/**
 * Helper function to make authenticated API requests
 * Automatically adds the Firebase ID token to the request headers
 * Now includes automatic token refresh and expiration checking
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  try {
    // Wait for auth to be ready
    const authReady = await isAuthReady();
    if (!authReady) {
      throw new AuthenticationError('Firebase Auth not available');
    }

    // Get the current user with retry logic
    const user = await waitForAuthState();
    if (!user) {
      throw new AuthenticationError('User not authenticated');
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
      credentials: 'include'
    });

    // Check if the response indicates an authentication error
    if (response.status === 401 || response.status === 403) {
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
        return retryResponse;
      } catch (refreshError) {
        throw new AuthenticationError('Authentication failed. Please sign in again.');
      }
    }

    return response;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Request failed');
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
