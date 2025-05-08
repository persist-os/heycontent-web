'use server';

import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import { adminAuth } from './firebase-admin';

interface FirebaseToken {
  uid?: string;
  user_id?: string;
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  exp: number;
  iat: number;
  aud: string;
  iss: string;
}

/**
 * Get Firebase token from cookies or Authorization header
 */
export const getFirebaseToken = async () => {
  try {
    // First try to get token from Authorization header
    const resolvedHeaders = await headers();
    const authHeader = resolvedHeaders.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log('Found token in Authorization header');
      const token = authHeader.substring(7);
      // Validate that it's a Firebase token (should be a JWT)
      try {
        // Basic validation - check if it's a JWT format
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.log('Authorization header token is not a valid JWT format');
          // Not a valid JWT, try cookie instead
        } else {
          return token;
        }
      } catch (tokenError) {
        console.log('Error parsing Authorization header token:', tokenError);
        // Continue to try cookie
      }
    }

    // Fallback to cookie
    const resolvedCookies = await cookies();
    const cookieToken = resolvedCookies.get('firebase-auth-token')?.value;
    if (cookieToken) {
      console.log('Found token in cookie');
      return cookieToken;
    }

    // Log all cookies for debugging
    const allCookies = await resolvedCookies.getAll();
    console.log('All cookies:', allCookies.map((c: { name: string }) => c.name));

    console.log('No token found in Authorization header or cookie');
    return null;
  } catch (error) {
    console.error('Error getting Firebase token:', error);
    return null;
  }
};

/**
 * Get user session from Firebase token
 */
export const getServerSession = async () => {
  console.log('getServerSession called');
  const tokenValue = await getFirebaseToken();
  if (!tokenValue) {
    console.log('No Firebase token found');
    return null;
  }

  try {
    console.log('Verifying token with Firebase Admin');

    // Verify the token with Firebase Admin SDK
    let decodedToken;
    try {
      // Ensure tokenValue is a string
      if (typeof tokenValue !== 'string') {
        console.error('Token is not a string:', typeof tokenValue);
        return null;
      }

      // Log token format for debugging (first few chars only)
      const tokenPreview = tokenValue.substring(0, 20) + '...';
      console.log('Token format (preview):', tokenPreview);

      decodedToken = await adminAuth.verifyIdToken(tokenValue);
    } catch (error) {
      console.error('Firebase Admin token verification failed:', error);

      // Try to decode the token manually to see if it's a valid JWT
      try {
        if (typeof tokenValue === 'string') {
          const manualDecoded = jwtDecode<FirebaseToken>(tokenValue);
          console.log('Manual token decode succeeded:', {
            uid: manualDecoded.uid || manualDecoded.user_id || manualDecoded.sub,
            email: manualDecoded.email
          });

          // If we can decode it but Firebase can't verify it, it might be expired
          // We could implement a fallback here if needed
        } else {
          console.error('Cannot manually decode token: not a string');
        }
      } catch (decodeError) {
        console.error('Manual token decode also failed:', decodeError);
      }

      return null;
    }

    if (!decodedToken) {
      console.error('Token verification failed');
      return null;
    }

    // Log the verified token information
    console.log('Token verified successfully:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture
    });

    // Create a session object with the user information from the verified token
    const session = {
      user: {
        id: decodedToken.uid,
        email: decodedToken.email || null,
        name: decodedToken.name || null,
        image: decodedToken.picture || null
      }
    };

    // Ensure the token is set in cookies for future requests
    // This is done in API routes, but we'll ensure it's set here as well
    try {
      const cookieStore = await cookies();
      const existingCookie = cookieStore.get('firebase-auth-token');

      // If the cookie doesn't exist or has a different value, update it
      if (!existingCookie || existingCookie.value !== tokenValue) {
        console.log('Updating firebase-auth-token cookie');
        // Note: This won't work in getServerSession due to cookies() being read-only in this context
        // But it's good to have the logic here for documentation purposes
      }
    } catch (cookieError) {
      // This will likely fail in getServerSession context, which is expected
      console.log('Note: Cannot modify cookies in this context, which is expected');
    }

    console.log('Session created successfully:', session);
    return session;
  } catch (error) {
    console.error('Error decoding Firebase token:', error);
    return null;
  }
};
