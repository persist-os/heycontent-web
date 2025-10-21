/**
 * Centralized Auth State Manager
 * 
 * This module prevents multiple onAuthStateChanged listeners from being created
 * across different components, which can cause Firebase Auth errors like
 * "Pending promise was never set".
 */

import { User, onAuthStateChanged, Auth } from 'firebase/auth';
import { getFirebaseAuth } from './firebase';

type AuthStateCallback = (user: User | null) => void;
type AuthErrorCallback = (error: Error) => void;

class AuthStateManager {
  private auth: Auth | null = null;
  private listeners: Set<AuthStateCallback> = new Set();
  private errorListeners: Set<AuthErrorCallback> = new Set();
  private unsubscribe: (() => void) | null = null;
  private currentUser: User | null = null;
  private isInitialized = false;

  constructor() {
    // Initialize auth state manager
    this.initialize();
  }

  private async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.auth = getFirebaseAuth();
      this.isInitialized = true;
      
      // Set up the single auth state listener
      this.unsubscribe = onAuthStateChanged(
        this.auth,
        (user) => {
          this.currentUser = user;
          // Notify all listeners
          this.listeners.forEach(callback => {
            try {
              callback(user);
            } catch (error) {
              console.error('[AuthStateManager] Error in auth callback:', error);
            }
          });
        },
        (error) => {
          console.error('[AuthStateManager] Auth state error:', error);
          // Notify all error listeners
          this.errorListeners.forEach(callback => {
            try {
              callback(error);
            } catch (callbackError) {
              console.error('[AuthStateManager] Error in error callback:', callbackError);
            }
          });
        }
      );
    } catch (error) {
      console.error('[AuthStateManager] Failed to initialize:', error);
    }
  }

  /**
   * Subscribe to auth state changes
   * Returns an unsubscribe function
   */
  subscribe(
    onAuthStateChanged: AuthStateCallback,
    onError?: AuthErrorCallback
  ): () => void {
    // Add listeners
    this.listeners.add(onAuthStateChanged);
    if (onError) {
      this.errorListeners.add(onError);
    }

    // If we already have a current user, call the callback immediately
    if (this.currentUser !== null) {
      try {
        onAuthStateChanged(this.currentUser);
      } catch (error) {
        console.error('[AuthStateManager] Error in immediate callback:', error);
      }
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(onAuthStateChanged);
      if (onError) {
        this.errorListeners.delete(onError);
      }
    };
  }

  /**
   * Get the current user synchronously
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if auth is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.auth !== null;
  }

  /**
   * Clean up the auth state manager
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
    this.errorListeners.clear();
    this.auth = null;
    this.currentUser = null;
    this.isInitialized = false;
  }
}

// Create singleton instance
const authStateManager = new AuthStateManager();

export { authStateManager };
export default authStateManager;
