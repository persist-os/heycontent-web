import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  getToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  getToken: async () => { throw new Error('AuthContext not initialized'); }
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isRedirecting = useRef(false);

  useEffect(() => {
    // Skip auth state changes on server side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let isMounted = true;
    (async () => {
      try {
        const { getFirebaseAuth } = await import('@/app/lib/firebase');
        const auth = getFirebaseAuth();
        unsubscribe = onAuthStateChanged(auth, (user) => {
          if (!isMounted) return;
          if (isRedirecting.current) return;

          setUser(user);
          setLoading(false);
          setError(null);
        }, (error) => {
          if (!isMounted) return;
          console.error('Auth state error:', error);
          setError(error.message);
          setLoading(false);
        });
      } catch (e) {
        if (isMounted) {
          setError('Firebase auth not initialized');
          setLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const safeRedirect = (path: string) => {
    isRedirecting.current = true;
    window.location.href = path;
  };

  // getToken returns the Firebase ID token for the current user
  const getToken = async () => {
    if (!user) throw new Error('User not authenticated');
    return await user.getIdToken();
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}