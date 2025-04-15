import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Initialize Firebase only once
let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (!app) {
  const firebaseConfig: FirebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
  };

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Set persistence to LOCAL to maintain session across page refreshes
    setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

if (!auth) {
  throw new Error('Firebase Auth failed to initialize');
}

export { auth }; 