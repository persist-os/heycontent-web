import { 
  GoogleAuthProvider, 
  signInWithRedirect, 
  getRedirectResult,
  UserCredential 
} from 'firebase/auth';
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
  isRedirecting?: boolean;
}

/**
 * Handles Google Sign-In flow with Firebase and backend authentication.
 * Uses redirect flow instead of popup to avoid cross-origin issues.
 * Supports both login and registration flows.
 */
export async function signInWithGoogle(
  options: GoogleSignInOptions = {}
): Promise<GoogleSignInResult> {
  const { action = 'login', additionalData } = options;

  try {
    // Get Firebase Auth instance
    const auth = getFirebaseAuth();
    
    // Wait a bit to ensure auth is fully initialized
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Store action and additional data in sessionStorage for retrieval after redirect
    if (action) {
      sessionStorage.setItem('google_auth_action', action);
    }
    if (additionalData) {
      sessionStorage.setItem('google_auth_data', JSON.stringify(additionalData));
    }
    
    // Create Google provider
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    // Use redirect instead of popup to avoid cross-origin issues
    await signInWithRedirect(auth, provider);
    
    // Function returns immediately, browser redirects to Google
    return {
      success: true,
      isRedirecting: true,
    };
    
  } catch (error: any) {
    console.error('Google Sign-In Error:', {
      code: error.code,
      message: error.message,
      fullError: error,
      origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
    });
    
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
 * Processes Google Sign-In redirect result after user returns from Google OAuth.
 * Call this on page load to complete the authentication flow.
 * 
 * IMPORTANT: Only calls getFirebaseAuth() if there's actually a pending redirect result.
 * This prevents unnecessary Firebase initialization on normal page loads.
 */
export async function handleGoogleRedirectResult(): Promise<GoogleSignInResult> {
  try {
    // Check if we're coming back from a redirect by looking for sessionStorage markers
    const hasAuthAction = sessionStorage.getItem('google_auth_action');
    const hasAuthData = sessionStorage.getItem('google_auth_data');
    
    // If no markers, this is a normal page load, not an OAuth redirect
    if (!hasAuthAction && !hasAuthData) {
      return { success: false };
    }
    
    // We have markers, so we're likely coming back from OAuth redirect
    const auth = getFirebaseAuth();
    const result = await getRedirectResult(auth);
    
    if (!result) {
      // No redirect result despite having markers - clean up and return
      sessionStorage.removeItem('google_auth_action');
      sessionStorage.removeItem('google_auth_data');
      return { success: false };
    }
    
    const user = result.user;
    
    if (!user) {
      return {
        success: false,
        error: 'No user returned from Google Sign-In'
      };
    }
    
    // Retrieve stored action and additional data from sessionStorage
    const action = sessionStorage.getItem('google_auth_action') || 'login';
    const additionalDataStr = sessionStorage.getItem('google_auth_data');
    const additionalData = additionalDataStr ? JSON.parse(additionalDataStr) : undefined;
    
    // Clean up sessionStorage
    sessionStorage.removeItem('google_auth_action');
    sessionStorage.removeItem('google_auth_data');
    
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
    console.error('Google Redirect Result Error:', {
      code: error.code,
      message: error.message,
      fullError: error,
    });
    
    return {
      success: false,
      error: error.message || 'An error occurred processing sign-in'
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

