import { getFirebaseAuth } from '@/app/lib/firebase'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getServerSession } from './server-auth'

interface AuthResponse {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
  };
}

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

export async function auth(): Promise<AuthResponse | null> {
  // For server-side, use the server-auth module
  if (!isClient) {
    return getServerSession();
  }

  // For client-side, use the Firebase Auth SDK
  const firebaseAuthInstance = getAuth();

  // Wait for auth state to be determined
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(firebaseAuthInstance, (user) => {
      unsubscribe();

      if (!user) {
        resolve(null);
        return;
      }

      resolve({
        user: {
          id: user.uid,
          email: user.email,
          name: user.displayName,
          image: user.photoURL
        }
      });
    });
  });
}