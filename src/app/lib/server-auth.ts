'use server';

import { cookies, headers } from 'next/headers';
import { adminAuth } from './firebase-admin';
import { validateApiKey } from './validateApiKey';
import { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Get Firebase token from cookies or Authorization header
 */
export const getFirebaseToken = async () => {
  try {
    // First try to get token from Authorization header
    const resolvedHeaders = await headers();
    const authHeader = resolvedHeaders.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Validate that it's a Firebase token (should be a JWT)
      try {
        // Basic validation - check if it's a JWT format
        const parts = token.split('.');
        if (parts.length !== 3) {
          // Not a valid JWT, try cookie instead
        } else {
          return token;
        }
      } catch (tokenError) {
        // Continue to try cookie
      }
    }

    // Fallback to cookie
    const resolvedCookies = await cookies();
    const cookieToken = resolvedCookies.get('firebase-auth-token')?.value;
    if (cookieToken) {
      return cookieToken;
    }

    // Log all cookies for debugging
    const allCookies = await resolvedCookies.getAll();
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Get user session from Firebase token
 */
export const getServerSession = async () => {
  const tokenValue = await getFirebaseToken();
  if (!tokenValue) {
    return null;
  }

  try {
    // New logic to handle both JWTs and custom API keys
    if (tokenValue.startsWith('hc-')) {
      const apiKeyDetails = await validateApiKey(tokenValue);
      if (!apiKeyDetails.isValid) {
        return {
          isAuthenticated: false,
          error: 'Invalid API key',
        };
      }
      return {
        isAuthenticated: true,
        userId: apiKeyDetails.userId,
        apiKey: tokenValue,
      };
    }

    // Default to Firebase JWT validation for backward compatibility
    try {
      const decodedToken = await adminAuth.verifyIdToken(tokenValue);
      return {
        isAuthenticated: true,
        userId: decodedToken.uid,
        token: tokenValue,
        decodedToken,
      };
    } catch (error) {
      return {
        isAuthenticated: false,
        error: 'Token verification failed',
      };
    }
  } catch (error) {
    return {
      isAuthenticated: false,
      error: 'An unexpected error occurred during authentication',
    };
  }
};

/**
 * Validates a Firebase ID token and returns the decoded token.
 * This function encapsulates the logic for verifying a token against Firebase Admin.
 *
 * @param token The Firebase ID token to validate.
 * @returns A promise that resolves with the decoded token if valid, or null otherwise.
 */
export async function validateFirebaseToken(
  token: string
): Promise<DecodedIdToken | null> {
  if (!token) {
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    return null;
  }
}
