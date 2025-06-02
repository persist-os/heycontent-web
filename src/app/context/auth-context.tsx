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

  useEffect(() => {
    // Skip auth state changes on server side
    if (typeof window === 'undefined') {
      setAuthLoading(false);
      return;
    }
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
        (user) => {
          if (isRedirecting.current) return;
          if (window.__FIREBASE_DEBUG) {
            // eslint-disable-next-line no-console
            console.log('[AUTH-CONTEXT] onAuthStateChanged fired. User:', user);
          }
          setFirebaseUser(user);
          setAuthLoading(false);
          setError(null);
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
  }, []);

  const safeRedirect = (path: string) => {
    isRedirecting.current = true;
    window.location.href = path;
  };

  // getToken returns the Firebase ID token for the current user
  const getToken = async () => {
    if (!firebaseUser) throw new Error('User not authenticated');
    return await firebaseUser.getIdToken();
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, authLoading, error, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}