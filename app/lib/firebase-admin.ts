import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin SDK
let adminApp: App | null = null;

if (getApps().length === 0) {
  try {
    // Path to the service account key file
    const serviceAccountPath = path.join(process.cwd(), 'firebase_key.json');
    
    // Check if the file exists
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error('firebase_key.json not found. Please make sure the file exists in the root directory.');
    }

    // Read the service account key file
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

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

    console.log('Firebase Admin initialized with service account for project:', serviceAccount.project_id);
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
} else {
  adminApp = getApps()[0];
}

if (!adminApp) {
  throw new Error('Failed to initialize Firebase Admin SDK');
}

// Export the Auth instance
export const adminAuth = getAuth(adminApp);
