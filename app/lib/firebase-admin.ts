import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin using default credentials
const adminApp = getApps().length === 0 
  ? initializeApp()
  : getApps()[0];

export const adminAuth = getAuth(adminApp); 