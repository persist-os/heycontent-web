// src/app/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


// Export a function to get the auth instance
export function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') throw new Error('Cannot use Firebase App on the server');
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') throw new Error('Cannot use Firebase Auth on the server');
  const app = getFirebaseApp();
  const auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error setting auth persistence:', error);
    }
  });
  return auth;
}