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
import { useConvexConfigured } from '../providers';

export type LanguageSource = 'auth' | 'manual' | 'auto' | 'default';

interface LanguageContextType {
  language: string;
  setLanguage: (newLanguage: string) => Promise<void>;
  source: LanguageSource;
  isAutoDetected: boolean;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider that uses Convex for authenticated users
function LanguageProviderWithConvex({ children }: { children: ReactNode }) {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;

  // Auth user preferences from Convex
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
        await updatePreferences({
          userId,
          preferences: {
            language: newLanguage,
          },
        });
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

// Fallback provider when Convex is not configured
function LanguageProviderFallback({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>('en');
  const [source, setSource] = useState<LanguageSource>('default');

  // Initialize language on mount
  useEffect(() => {
    const stored = getStoredLanguage();

    if (stored) {
      setLanguageState(stored.lang);
      setSource(stored.source === 'manual' ? 'manual' : 'auto');
    } else {
      const detected = detectBrowserLanguage();
      setLanguageState(detected);
      setSource(detected === 'en' ? 'default' : 'auto');

      if (detected !== 'en') {
        setStoredLanguage(detected, 'auto');
      }
    }
  }, []);

  const setLanguage = useCallback(async (newLanguage: string) => {
    setLanguageState(newLanguage);
    setSource('manual');
    setStoredLanguage(newLanguage, 'manual');
  }, []);

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    source,
    isAutoDetected: source === 'auto',
    isLoading: false,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

// Main provider that chooses implementation based on Convex availability
export function LanguageProvider({ children }: { children: ReactNode }) {
  const isConvexConfigured = useConvexConfigured();

  if (isConvexConfigured) {
    return <LanguageProviderWithConvex>{children}</LanguageProviderWithConvex>;
  }

  return <LanguageProviderFallback>{children}</LanguageProviderFallback>;
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
}

