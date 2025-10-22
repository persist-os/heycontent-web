import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirebaseAuth } from './firebase';
import { waitForAuthReady } from './api-helpers';
import Cookies from 'js-cookie';

interface GoogleSignInOptions {
  action?: 'login' | 'register';
  additionalData?: {
    username?: string;
    referredBy?: string;
  };
}

interface GoogleSignInResult {
  success: boolean;
  error?: string;
  redirect?: string;
  apiKey?: string;
}

/**
 * Handles Google Sign-In flow with Firebase and backend authentication.
 * Supports both login and registration flows.
 */
export async function signInWithGoogle(
  options: GoogleSignInOptions = {}
): Promise<GoogleSignInResult> {
  const { action = 'login', additionalData } = options;

  try {
    // Get Firebase Auth instance
    const auth = getFirebaseAuth();
    
    // Create Google provider
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    // Sign in with popup
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    if (!user) {
      return {
        success: false,
        error: 'No user returned from Google Sign-In'
      };
    }
    
    // Get Firebase ID token
    const idToken = await user.getIdToken(true);
    
    // Prepare payload for backend
    const payload: any = {
      idToken,
      action,
    };
    
    // Add user info from Google
    if (user.displayName) {
      payload.name = user.displayName;
    }
    
    // Add additional data if provided (username, referredBy)
    if (additionalData) {
      if (additionalData.username) {
        payload.username = additionalData.username;
      }
      if (additionalData.referredBy) {
        payload.referredBy = additionalData.referredBy;
      }
    }
    
    // Send to backend for API key
    const response = await fetch('/api/auth/firebase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Authentication failed'
      };
    }
    
    // Wait for cookie to be set
    await confirmCookie(data.apiKey);
    
    // CRITICAL: Wait for Firebase auth state to settle
    // This ensures the user is authenticated before redirect
    await waitForAuthReady(5, 200);
    
    return {
      success: true,
      redirect: data.redirect || '/dashboard',
      apiKey: data.apiKey
    };
    
  } catch (error: any) {
    // Handle Firebase auth errors
    if (error.code === 'auth/popup-closed-by-user') {
      return {
        success: false,
        error: 'Sign-in cancelled'
      };
    }
    
    if (error.code === 'auth/popup-blocked') {
      return {
        success: false,
        error: 'Pop-up blocked. Please allow pop-ups for this site.'
      };
    }
    
    if (error.code === 'auth/network-request-failed') {
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      };
    }
    
    return {
      success: false,
      error: error.message || 'An error occurred during sign-in'
    };
  }
}

/**
 * Handles Google OAuth redirect result processing
 * Used when returning from Google OAuth redirect flow
 */
export async function handleGoogleRedirectResult(): Promise<GoogleSignInResult> {
  try {
    // Check if we have URL parameters indicating a redirect result
    if (typeof window === 'undefined') {
      return { success: false, error: 'Not in browser environment' };
    }

    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    // If there's an error parameter, handle it
    if (error) {
      return {
        success: false,
        error: `OAuth error: ${error}`
      };
    }

    // If there's no code parameter, this isn't a redirect result
    if (!code) {
      return { success: false, error: 'No redirect result found' };
    }

    // Process the authorization code
    // This would typically involve exchanging the code for tokens
    // For now, we'll redirect to the dashboard
    return {
      success: true,
      redirect: '/dashboard'
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error processing redirect result'
    };
  }
}

/**
 * Wait for both API key and Firebase auth token cookies to be set by server
 * This is CRITICAL - middleware checks for firebase-auth-token before allowing access
 */
async function confirmCookie(apiKey?: string): Promise<void> {
  const start = Date.now();
  const deadline = start + 1000; // wait up to 1 second
  
  let apiKeyCookie = Cookies.get('apiKey');
  let firebaseTokenCookie = Cookies.get('firebase-auth-token');
  
  // Wait for BOTH cookies to be set
  while ((!apiKeyCookie || !firebaseTokenCookie) && Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 50));
    apiKeyCookie = Cookies.get('apiKey');
    firebaseTokenCookie = Cookies.get('firebase-auth-token');
  }
  
  // Fallback: Set apiKey cookie client-side if not set by server
  if (!apiKeyCookie && apiKey) {
    Cookies.set('apiKey', JSON.stringify(apiKey), {
      expires: 7,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
  }
}
