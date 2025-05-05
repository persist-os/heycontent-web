'use client';

import { auth } from '@/app/lib/firebase';

/**
 * Helper function to make authenticated API requests
 * Automatically adds the Firebase ID token to the request headers
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
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
