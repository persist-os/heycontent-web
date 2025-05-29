'use client';

import { getFirebaseAuth } from '@/app/lib/firebase';

import dotenv from 'dotenv';

dotenv.config();

/**
 * Get API key from localStorage or request a new one
 */
export async function getApiKey(): Promise<string | null> {
  const auth = getFirebaseAuth();
  try {
    // First try to get the API key from localStorage
    const storedApiKey = localStorage.getItem('apiKey');
    let needsRefresh = false;
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
      console.log('[getApiKey] Firebase user:', firebaseUserId, '| API key:', apiKey, '| Extracted user from key:', keyUserId, '| Match:', userMatches);
      if (!isValid || !userMatches) {
        console.warn('API key in localStorage is invalid or does not match current user. Removing and refreshing...');
        localStorage.removeItem('apiKey');
        needsRefresh = true;
      } else {
        // Valid key found for current user
        console.log('Retrieved API key from localStorage for current user');
        return apiKey;
      }
    } else {
      needsRefresh = true;
    }

    // If no valid API key and we have a Firebase user, request one from the backend
    if (needsRefresh && auth && auth.currentUser) {
      const userId = auth.currentUser.uid;
      console.log('No valid API key found, requesting one for user:', userId);
      try {
        // Get a fresh Firebase ID token
        const idToken = await auth.currentUser.getIdToken(true);
        console.log('Got Firebase ID token, sending to backend to create API key...');
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
          // Log the full backend response for debugging
          console.log('[getApiKey] Full backend response:', data);
          // Log the userId we requested and the key returned
          console.log('[getApiKey] Requested API key for Firebase user:', userId, '| API key received from backend:', apiKeyValue);
          if (typeof apiKeyValue === 'string' && apiKeyValue.startsWith('heycontent_') && !apiKeyValue.endsWith('_temporary')) {
            localStorage.setItem('apiKey', JSON.stringify(apiKeyValue));
            console.log('API key saved to localStorage:', apiKeyValue);
            // Log what is now in localStorage
            console.log('API key in localStorage after save:', localStorage.getItem('apiKey'));
            return apiKeyValue;
          } else {
            console.warn('Received invalid or temporary API key from backend:', apiKeyValue);
            localStorage.removeItem('apiKey');
            return null;
          }
        } else {
          const errorData = await response.json();
          console.warn('Failed to get API key from backend:', errorData);
          return null;
        }
      } catch (apiError) {
        console.error('Error requesting API key from backend:', apiError);
        return null;
      }
      // No API key available if backend fails
      return null;
    }
    
    // If we get here, it means needsRefresh is true but no auth/currentUser is available
    console.log('No valid API key and no authenticated user to request one');
    return null;
  } catch (error) {
    console.error('Error getting API key:', error);
    throw new Error('No valid API key available. Please contact support.');
  }
}

/**
 * Get the current user ID from Firebase Auth
 */
export function getCurrentUserId(): string | null {
  const auth = getFirebaseAuth();
  if (auth && auth.currentUser) {
    return auth.currentUser.uid;
  } else {
    // get it from localStorage
    const apiKey = localStorage.getItem('apiKey');
    if (apiKey) {
      const keyParts = apiKey.split('_');
      if (keyParts.length >= 3) {
        return keyParts[1];
      }
    }
    return null;
  }
}


/**
 * Helper function to make authenticated API requests
 * Automatically adds the Firebase ID token to the request headers
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const auth = getFirebaseAuth();
  if (!auth) return;
  try {
    // Get the current user
    const user = auth.currentUser;

    if (!user) {
      console.error('fetchWithAuth: No authenticated user found');
      throw new Error('User not authenticated');
    }

    // Get the ID token with force refresh to ensure it's up to date
    console.log('fetchWithAuth: Getting fresh ID token');
    const token = await user.getIdToken(true);

    // Also set the token in a cookie for server-side access
    // Use a more permissive SameSite policy to ensure the cookie is sent with cross-site requests
    document.cookie = `firebase-auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax; secure=${process.env.NODE_ENV === 'production'}`;

    // Create headers with Authorization
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    console.log(`fetchWithAuth: Making request to ${url}`);

    // Make the request with the token
    const response = await fetch(url, {
      ...options,
      headers,
      // Add credentials: 'include' to ensure cookies are sent with the request
      credentials: 'include'
    });

    console.log(`fetchWithAuth: Response status: ${response.status}`);

    return response;
  } catch (error) {
    console.error('Error in fetchWithAuth:', error);
    throw error;
  }
}
// --- SMART NOTE API HELPERS ---

/**
 * Fetch prompt templates for a given platform and post type.
 * Returns an array of { file, content } objects.
 */
export async function fetchPlatformPrompts(platform: string, postType: string = 'default'): Promise<{ file: string, content: string }[]> {
  const url = `/api/v1/platform-metadata/prompts?platform=${encodeURIComponent(platform)}&postType=${encodeURIComponent(postType)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch prompts: ${res.status}`);
  const data = await res.json();
  return data.prompts || [];
}


export interface AnalyzeSmartNoteRequest {
  noteId: string;
  platform: string;
  userId: string;
}
export interface AnalyzeSmartNoteResponse {
  success: boolean;
  analysisId: string;
  data: { ideas: string[] };
}

export interface GenerateIdeasRequest {
  userId: string;
  limit?: number;
}
export interface GenerateIdeasResponse {
  ideas: string[];
}

export interface ExecuteIdeaRequest {
  userId: string;
  idea: string;
  note: string;
  context?: Record<string, any>;
}
export interface ExecuteIdeaResponse {
  result: string;
}

export async function fetchWithApiKey(url: string, options: RequestInit = {}): Promise<Response> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No API key found. Please log in again.');
  const headers = {
    ...(options.headers || {}),
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  const response = await fetch(url, {
    ...options,
    headers,
  });
  return response;
}

export async function analyzeSmartNote(
  req: AnalyzeSmartNoteRequest
): Promise<AnalyzeSmartNoteResponse> {
  const response = await fetchWithApiKey('/api/v1/smart-note/analyze', {
    method: 'POST',
    body: JSON.stringify(req),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.detail || err?.message || 'Failed to analyze note');
  }
  return response.json();
}

export async function generateSmartNoteIdeas(
  req: GenerateIdeasRequest
): Promise<GenerateIdeasResponse> {
  const response = await fetchWithApiKey('/api/v1/smart-note/ideas/', {
    method: 'POST',
    body: JSON.stringify(req),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.detail || err?.message || 'Failed to generate ideas');
  }
  return response.json();
}

export async function executeSmartNoteIdea(
  req: ExecuteIdeaRequest
): Promise<ExecuteIdeaResponse> {
  const response = await fetchWithApiKey('/api/v1/smart-note/ideas/execute', {
    method: 'POST',
    body: JSON.stringify(req),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.detail || err?.message || 'Failed to execute idea');
  }
  return response.json();
}
