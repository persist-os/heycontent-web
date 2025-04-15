import { auth as firebaseAuth } from '@/app/lib/firebase'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

interface AuthResponse {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
  };
}

export async function auth(): Promise<AuthResponse | null> {
  const firebaseAuthInstance = getAuth()
  
  // Wait for auth state to be determined
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(firebaseAuthInstance, (user) => {
      unsubscribe()
      
      if (!user) {
        resolve(null)
        return
      }

      resolve({
        user: {
          id: user.uid,
          email: user.email,
          name: user.displayName,
          image: user.photoURL
        }
      })
    })
  })
} 