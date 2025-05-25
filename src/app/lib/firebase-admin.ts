import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin SDK
let adminApp: App | null = null;

if (getApps().length === 0) {
  try {
    console.log('Initializing Firebase Admin SDK...');
    
    // Detect the path to the service account key
    const defaultLocalPath = path.join(process.cwd(), 'firebase_key.json');
    const serviceAccountPath = process.env.FIREBASE_KEY_PATH || defaultLocalPath;
    console.log('Looking for service account at:', serviceAccountPath);

    // Check if the file exists
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Firebase service account key not found at ${serviceAccountPath}.\n` +
        'Set the FIREBASE_KEY_PATH env var to the mounted secret path in Cloud Run, or place firebase_key.json in project root for local dev.');
    }

    // Read the service account key file
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.log('Service account loaded successfully from:', serviceAccountPath);

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
