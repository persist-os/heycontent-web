'use client';

import { auth } from '@/app/lib/firebase';

/**
 * Helper function to make authenticated API requests
 * Automatically adds the Firebase ID token to the request headers
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
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

    // Only fix the session if we haven't done so recently
    const lastFixAttempt = localStorage.getItem('last-session-fix');
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000; // 5 minutes ago

    if (!lastFixAttempt || parseInt(lastFixAttempt) < fiveMinutesAgo) {
      try {
        console.log('Fixing session before request...');
        const fixResponse = await fetch('/api/auth/fix-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ token })
        });

        if (fixResponse.ok) {
          localStorage.setItem('last-session-fix', now.toString());
          console.log('Session fixed successfully');
        }
      } catch (e) {
        console.warn('Failed to fix session, but continuing with request:', e);
      }
    } else {
      console.log('Skipping session fix, last attempt was too recent');
    }

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
