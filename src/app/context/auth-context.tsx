// Extend Window interface for debug globals
declare global {
  interface Window {
    __FIREBASE_AUTH_IN_EFFECT?: boolean;
    __FIREBASE_DEBUG?: boolean;
  }
}

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '@/app/lib/firebase';
import { TokenRefreshService } from '@/app/lib/token-refresh-service';
import { getValidToken, removeFirebaseToken } from '@/app/lib/firebase-token-manager';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface AuthContextType {
  firebaseUser: User | null;
  authLoading: boolean;
  error: string | null;
  getToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  authLoading: true,
  error: null,
  getToken: async () => { throw new Error('AuthContext not initialized'); }
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isRedirecting = useRef(false);
  const lastUserId = useRef<string | null>(null);

  // Action to trigger login sync
  const handleUserLogin = useAction(api.userActions.handleUserLogin);

  useEffect(() => {
    // Skip auth state changes on server side
    if (typeof window === 'undefined') {
      setAuthLoading(false);
      return;
    }
    
    // Set the flag to indicate we're in a useEffect
    window.__FIREBASE_AUTH_IN_EFFECT = true;
    
    let unsubscribe = () => {};
    try {
      const auth = getFirebaseAuth();
      // Debug: log when auth instance is acquired
      if (window.__FIREBASE_DEBUG) {
        // eslint-disable-next-line no-console
        console.log('[AUTH-CONTEXT] Firebase Auth instance acquired');
      }
      unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          if (isRedirecting.current) return;
          if (window.__FIREBASE_DEBUG) {
            // eslint-disable-next-line no-console
            console.log('[AUTH-CONTEXT] onAuthStateChanged fired. User:', user);
          }
          
          const previousUserId = lastUserId.current;
          const currentUserId = user?.uid || null;
          
          setFirebaseUser(user);
          setAuthLoading(false);
          setError(null);
          
          // Trigger login sync if user logged in (not just auth state change)
          if (user && currentUserId !== previousUserId) {
            console.log('🔐 [AUTH-CONTEXT] New user login detected, triggering sync:', currentUserId);
            try {
              await handleUserLogin({ userId: currentUserId });
            } catch (error) {
              console.error('Failed to trigger login sync:', error);
            }
          }
          
          lastUserId.current = currentUserId;
        },
        (error) => {
          console.error('[AUTH-CONTEXT] Auth state error:', error);
          setError(error.message);
          setAuthLoading(false);
        }
      );
    } catch (e) {
      setError('Firebase auth not initialized');
      setAuthLoading(false);
      if (window.__FIREBASE_DEBUG) {
        // eslint-disable-next-line no-console
        console.error('[AUTH-CONTEXT] Error initializing Firebase Auth:', e);
      }
    }
    return () => {
      unsubscribe();
      window.__FIREBASE_AUTH_IN_EFFECT = false;
    };
  }, [handleUserLogin]);

  const safeRedirect = (path: string) => {
    isRedirecting.current = true;
    window.location.href = path;
  };

  // Enhanced getToken that ensures we always get a valid token
  const getToken = async (): Promise<string> => {
    if (!firebaseUser) throw new Error('User not authenticated');
    
    try {
      // Use the enhanced token manager to get a valid token
      return await getValidToken(firebaseUser);
    } catch (error) {
      console.error('Failed to get valid token:', error);
      // If token refresh fails, clear stored tokens and throw error
      removeFirebaseToken();
      throw new Error('Failed to refresh authentication token. Please sign in again.');
    }
  };

  // Handle token refresh events
  const handleTokenRefreshError = (error: Error) => {
    console.error('Background token refresh failed:', error);
    setError('Authentication session expired. Please sign in again.');
    // Optionally redirect to login or show a notification
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, authLoading, error, getToken }}>
      {/* Include the token refresh service */}
      <TokenRefreshService 
        user={firebaseUser} 
        onTokenRefreshError={handleTokenRefreshError}
      />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}