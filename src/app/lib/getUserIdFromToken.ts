import { adminAuth } from './firebase-admin';
import { jwtDecode } from 'jwt-decode';

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
 * Utility to extract userId from a Firebase ID token string.
 * Returns the UID (userId) if valid, otherwise null.
 */
export async function getUserIdFromToken(tokenValue: string): Promise<string | null> {
  if (!tokenValue || typeof tokenValue !== 'string') {
    return null;
  }

  // Try to verify with Firebase Admin
  try {
    const decodedToken = await adminAuth.verifyIdToken(tokenValue);
    // Prefer uid, fallback to sub/user_id if present
    return decodedToken.uid || decodedToken.user_id || decodedToken.sub || null;
  } catch (error) {
    // If verification fails, try to decode manually (may be expired or invalid)
    try {
      const manualDecoded = jwtDecode<FirebaseToken>(tokenValue);
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      if (manualDecoded.exp < currentTime) {
        return null; // Token has expired
      }
      return manualDecoded.uid || manualDecoded.user_id || manualDecoded.sub || null;
    } catch (decodeError) {
      // Both verification and decode failed
      return null;
    }
  }
}
