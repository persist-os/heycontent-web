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

// Initialize Firebase only on client side
let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (isClient) {
  try {
    // Initialize Firebase if it hasn't been initialized yet
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully');
    } else {
      app = getApp();
    }

    // Initialize auth
    if (app) {
      auth = getAuth(app);
      setPersistence(auth, browserLocalPersistence)
        .catch((error) => {
          console.error('Error setting auth persistence:', error);
        });
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

// Export a function to get the auth instance
export const getFirebaseAuth = () => {
  if (!auth) {
    throw new Error('Firebase Auth not initialized');
  }
  return auth;
};

// Export a function to get the app instance
export const getFirebaseApp = () => {
  if (!app) {
    throw new Error('Firebase App not initialized');
  }
  return app;
};