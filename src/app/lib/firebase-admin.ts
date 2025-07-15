import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
// Add fs for local file reading
import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin SDK
let adminApp: App | null = null;

if (getApps().length === 0) {
  try {
    console.log('Initializing Firebase Admin SDK...');

    let serviceAccount;
    // Use FIREBASE_SERVICE_ACCOUNT_JSON on Vercel, otherwise load firebase_key.json from root
    if (process.env.VERCEL) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (!serviceAccountJson) {
        throw new Error(
          'FIREBASE_SERVICE_ACCOUNT_JSON env var not set. Please provide the full service account JSON as an environment variable.'
        );
      }
      try {
        serviceAccount = JSON.parse(serviceAccountJson);
      } catch (e) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
      }
    } else {
      // Local: read firebase_key.json from project root
      const keyPath = path.resolve(process.cwd(), 'firebase_key.json');
      if (!fs.existsSync(keyPath)) {
        throw new Error('firebase_key.json not found in project root.');
      }
      try {
        const file = fs.readFileSync(keyPath, 'utf8');
        serviceAccount = JSON.parse(file);
      } catch (e) {
        throw new Error('Failed to read or parse firebase_key.json.');
      }
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