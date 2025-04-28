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

// Only log in development
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Config:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId: !!firebaseConfig.projectId,
    hasStorageBucket: !!firebaseConfig.storageBucket,
    hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
    hasAppId: !!firebaseConfig.appId,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId
  });
}

// Initialize Firebase only on client side
let app: FirebaseApp;
let auth: Auth | null = null;

if (isClient) {
  try {
    console.log('Initializing Firebase client...');
    
    // Check if Firebase is already initialized
    if (getApps().length === 0) {
      console.log('Creating new Firebase app instance...');
      app = initializeApp(firebaseConfig);
      console.log('Firebase app initialized successfully');
    } else {
      console.log('Reusing existing Firebase app instance');
      app = getApp();
    }

    // Initialize auth
    console.log('Initializing Firebase Auth...');
    auth = getAuth(app);
    console.log('Firebase Auth initialized successfully');

    // Set persistence
    console.log('Setting auth persistence...');
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('Auth persistence set successfully');
      })
      .catch(error => {
        console.error('Error setting auth persistence:', error);
      });

  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

// Helper function to get Firebase token from cookies - moved to server-only file
// This functionality is now in app/lib/server-auth.ts

export { app, auth };