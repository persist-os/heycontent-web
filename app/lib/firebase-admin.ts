import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
const firebaseAdminConfig = {
  projectId: 'heycontent-a9bc3',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Check if Firebase Admin is already initialized
let adminApp: App | null = null;

if (getApps().length === 0) {
  try {
    if (!firebaseAdminConfig.projectId) {
      throw new Error('Firebase project ID is not defined');
    }

    // If we have service account credentials, use them
    if (firebaseAdminConfig.clientEmail && firebaseAdminConfig.privateKey) {
      adminApp = initializeApp({
        credential: cert({
          projectId: firebaseAdminConfig.projectId,
          clientEmail: firebaseAdminConfig.clientEmail,
          privateKey: firebaseAdminConfig.privateKey,
        }),
      });
      console.log('Firebase Admin initialized with service account for project:', firebaseAdminConfig.projectId);
    } else {
      throw new Error('Firebase Admin credentials are missing. Please check FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY environment variables.');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error; // Re-throw to prevent silent failures
  }
} else {
  adminApp = getApps()[0];
}

if (!adminApp) {
  throw new Error('Failed to initialize Firebase Admin SDK');
}

// Export the Auth instance
export const adminAuth = getAuth(adminApp);
