import { onAuthStateChanged } from 'firebase/auth';

interface AuthResponse {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
  };
}

// Check if we're on the client side
export async function auth(): Promise<AuthResponse | null> {
  if (typeof window === 'undefined') {
    // Server-side: dynamically import to avoid loading client code
    const { getServerSession } = await import('./server-auth');
    return getServerSession();
  }
  // Client-side: dynamically import Firebase code
  const { getFirebaseAuth } = await import('@/app/lib/firebase');
  const firebaseAuthInstance = getFirebaseAuth();

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