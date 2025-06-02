// src/app/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';

// Debug utility
declare const window: any;
const debugLog = (...args: any[]) => {
  if (typeof window !== 'undefined' && window.__FIREBASE_DEBUG) {
    // Only log if global debug flag is set
    // @ts-ignore
    // eslint-disable-next-line no-console
    console.log('[FIREBASE]', ...args);
  }
};

// Strict client check
const isClient = typeof window !== 'undefined';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function isConfigValid(config: Record<string, any>) {
  return Object.entries(config).every(([key, value]) => {
    if (!value) {
      console.error(`[FIREBASE] Missing Firebase config value for: ${key}`);
      return false;
    }
    return true;
  });
}

// --- TRUE SINGLETONS ---
let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;

export function getFirebaseApp(): FirebaseApp {
  if (!isClient) throw new Error('[FIREBASE] Cannot use Firebase App on the server');
  if (!isConfigValid(firebaseConfig)) throw new Error('[FIREBASE] Missing Firebase config values. Check your .env or deployment environment.');
  if (!app) {
    if (!getApps().length) {
      debugLog('Initializing Firebase App');
      app = initializeApp(firebaseConfig);
    } else {
      debugLog('Using existing Firebase App');
      app = getApp();
    }
  }
  return app;
}

/**
 * Returns the singleton Firebase Auth instance. Should only be called client-side and preferably inside useEffect or client hooks.
 * Logs a warning if called outside a useEffect or without client check.
 */
export function getFirebaseAuth(): Auth {
  if (!isClient) throw new Error('[FIREBASE] Cannot use Firebase Auth on the server');
  // Optionally warn if not in effect
  if (typeof window !== 'undefined' && !(window.__FIREBASE_AUTH_IN_EFFECT || false)) {
    console.warn('[FIREBASE] WARNING: getFirebaseAuth() called outside useEffect or without client check. This may cause hydration or auth issues.');
  }
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    auth = getAuth(firebaseApp);
    setPersistence(auth, browserLocalPersistence).then(() => {
      debugLog('Auth persistence set to browserLocalPersistence');
    }).catch((error) => {
      console.error('[FIREBASE] Error setting auth persistence:', error);
    });
    debugLog('Initialized Firebase Auth singleton');
  }
  return auth;
}