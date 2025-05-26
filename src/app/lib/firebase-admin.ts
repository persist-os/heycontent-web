import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
let adminApp: App | null = null;

if (getApps().length === 0) {
  try {
    console.log('Initializing Firebase Admin SDK...');
    
    // Use the raw JSON from the environment variable
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_JSON env var not set. Please provide the full service account JSON as an environment variable.'
      );
    }
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (e) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
    }

    // Log the service account details (excluding private key)
    console.log('Firebase Admin Config:', {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKeyPresent: !!serviceAccount.private_key,
      privateKeyLength: serviceAccount.private_key?.length
    });

    // Initialize Firebase Admin
    adminApp = initializeApp({
      credential: cert(serviceAccount)
    });

    console.log('Firebase Admin initialized successfully with project:', serviceAccount.project_id);
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
} else {
  console.log('Firebase Admin already initialized, reusing existing app');
  adminApp = getApps()[0];
}

if (!adminApp) {
  throw new Error('Failed to initialize Firebase Admin SDK');
}

// Export the Auth instance
export const adminAuth = getAuth(adminApp);
