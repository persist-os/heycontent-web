import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, getIdToken } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  token: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User exists' : 'No user');
      setUser(user);
      
      if (user) {
        try {
          console.log('Getting ID token for user');
          const token = await getIdToken(user);
          console.log('Token obtained successfully');
          setToken(token);
          
          // Set the token in a cookie for the middleware
          document.cookie = `firebase-auth-token=${token}; path=/; secure; samesite=strict; max-age=604800`; // 1 week
        } catch (error) {
          console.error('Error getting token:', error);
          setToken(null);
          document.cookie = 'firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      } else {
        console.log('No user, clearing token');
        setToken(null);
        document.cookie = 'firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 