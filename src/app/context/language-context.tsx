'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  detectBrowserLanguage,
  getStoredLanguage,
  setStoredLanguage,
} from '@/lib/language-utils';

export type LanguageSource = 'auth' | 'manual' | 'auto' | 'default';

interface LanguageContextType {
  language: string;
  setLanguage: (newLanguage: string) => Promise<void>;
  source: LanguageSource;
  isAutoDetected: boolean;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;

  // Auth user preferences from Convex (will return undefined if backend not connected)
  const userPreferences = useQuery(
    api.userQueries.getUserPreferences,
    userId ? { userId } : 'skip'
  );
  const updatePreferences = useMutation(api.userMutations.updateUserPreferences);

  // Guest user state
  const [guestLanguage, setGuestLanguage] = useState<string>('en');
  const [source, setSource] = useState<LanguageSource>('default');

  // Initialize guest language on mount
  useEffect(() => {
    if (firebaseUser) return; // Skip if authenticated

    const stored = getStoredLanguage();

    if (stored) {
      // Use stored preference
      setGuestLanguage(stored.lang);
      setSource(stored.source === 'manual' ? 'manual' : 'auto');
    } else {
      // Auto-detect browser language
      const detected = detectBrowserLanguage();
      setGuestLanguage(detected);
      setSource(detected === 'en' ? 'default' : 'auto');

      // Save auto-detected language (only if not English)
      if (detected !== 'en') {
        setStoredLanguage(detected, 'auto');
      }
    }
  }, [firebaseUser]);

  // Sync auth user language from Convex to local state
  useEffect(() => {
    if (firebaseUser && userPreferences?.language) {
      setGuestLanguage(userPreferences.language);
      setSource('auth');
    }
  }, [firebaseUser, userPreferences?.language]);

  // Determine final language based on auth state
  const finalLanguage = firebaseUser ? (userPreferences?.language || 'en') : guestLanguage;
  const finalSource: LanguageSource = firebaseUser ? 'auth' : source;

  // Unified setLanguage function
  const setLanguage = useCallback(
    async (newLanguage: string) => {
      if (firebaseUser && userId) {
        // Authenticated user - save to Convex + localStorage
        try {
          await updatePreferences({
            userId,
            preferences: {
              language: newLanguage,
            },
          });
        } catch (e) {
          // Convex may not be connected, fall back to localStorage only
          console.warn('Could not save language to backend:', e);
        }
        setStoredLanguage(newLanguage, 'manual');
        setGuestLanguage(newLanguage); // Update local state immediately for responsiveness
        setSource('auth');
      } else {
        // Guest user - save to localStorage and update state
        setGuestLanguage(newLanguage);
        setSource('manual');
        setStoredLanguage(newLanguage, 'manual');
      }
    },
    [firebaseUser, userId, updatePreferences]
  );

  const contextValue: LanguageContextType = {
    language: finalLanguage,
    setLanguage,
    source: finalSource,
    isAutoDetected: finalSource === 'auto',
    isLoading: firebaseUser ? userPreferences === undefined : false,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
}

