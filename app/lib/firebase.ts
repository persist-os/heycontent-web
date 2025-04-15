import { initializeApp, getApps, getApp } from 'firebase/app';
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

// Only log in development
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Config:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId: !!firebaseConfig.projectId,
    hasStorageBucket: !!firebaseConfig.storageBucket,
    hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
    hasAppId: !!firebaseConfig.appId,
  });
}

// Initialize Firebase only on client side
let app;
let auth: Auth;

if (isClient) {
  try {
    // Check if Firebase is already initialized
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    // Initialize auth
    auth = getAuth(app);

    // Set persistence
    setPersistence(auth, browserLocalPersistence)
      .catch(error => {
        console.error('Error setting auth persistence:', error);
      });

    // Debug logging only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Firebase initialized:', {
        appInitialized: !!app,
        authInitialized: !!auth,
        existingApps: getApps().length,
        isClient
      });
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
} else {
  // On server side, create a dummy auth object
  auth = {} as Auth;
}

// Helper function to get Firebase token from cookies - moved to server-only file
// This functionality is now in app/lib/server-auth.ts

export { app, auth };