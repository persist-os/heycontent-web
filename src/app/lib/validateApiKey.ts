import { getFirebaseAuth } from './firebase';

interface ValidationResult {
  isValid: boolean;
  userId: string | null;
}

/**
 * Validates an API key and extracts the user ID
 * Handles both custom API keys (heycontent_userId_hash) and Firebase tokens
 */
export function validateApiKey(apiKey: string): ValidationResult {
  try {
    // Check if it's a custom API key format: heycontent_userId_hash
    if (apiKey.startsWith('heycontent_')) {
      const parts = apiKey.split('_');
      if (parts.length >= 3) {
        // Extract userId from the custom API key
        // Format: heycontent_userId_hash
        const userId = parts[1];
        if (userId && userId.length > 0) {
          return { isValid: true, userId };
        }
      }
      return { isValid: false, userId: null };
    }
    
    // For Firebase tokens, we don't validate here since it requires async operations
    // This function is synchronous, Firebase validation should be done separately
    return { isValid: false, userId: null };
  } catch (error) {
    console.error('Error validating API key:', error);
    return { isValid: false, userId: null };
  }
}

/**
 * Alternative async function to get user ID from token (for backward compatibility)
 * This was the original function name used in some routes and handles Firebase tokens
 */
export async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    // Check if it's a custom API key format first
    if (token.startsWith('heycontent_')) {
      const validation = validateApiKey(token);
      return validation.isValid ? validation.userId : null;
    }
    
    // If not a custom API key, try to validate as Firebase token
    try {
      const auth = getFirebaseAuth();
      if (auth && auth.app) {
        // Import Firebase Admin here to avoid issues
        const { auth: adminAuth } = await import('firebase-admin');
        
        // Verify the Firebase token
        const decodedToken = await adminAuth().verifyIdToken(token);
        return decodedToken.uid;
      }
    } catch (firebaseError) {
      // Firebase token validation failed
      console.log('Firebase token validation failed:', firebaseError);
    }
    
    return null;
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
} 