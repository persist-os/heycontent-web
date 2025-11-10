import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { setStoredLanguage } from '@/lib/language-utils';
import { useTranslationBatch } from './useTranslationBatch';

export interface TranslationState {
  text: string;
  isTranslating: boolean;
  isFromCache: boolean;
  error: string | null;
  retryCount?: number;
}

/**
 * Hook for progressive translation with cache-first approach and BATCHING
 * 
 * Flow:
 * 1. Check Convex cache
 * 2. If cached → return instantly
 * 3. If not cached → queue for batch translation (reduces API calls)
 * 4. Batch processor translates multiple texts in one API call
 * 5. AI translates → smooth fade to translated text
 * 6. Save to cache for future users
 * 
 * BATCHING: Uses useTranslationBatch internally to batch uncached translations
 */
export function useTranslation(
  sourceText: string,
  options: {
    sourceLang?: string;
    targetLang?: string;
    context?: string;
    enabled?: boolean;
  } = {}
) {
  const { firebaseUser } = useAuth();
  const {
    sourceLang = 'en',
    targetLang = 'en',
    context,
    enabled = true,
  } = options;

  const [translationState, setTranslationState] = useState<TranslationState>({
    text: sourceText,
    isTranslating: false,
    isFromCache: false,
    error: null,
    retryCount: 0,
  });

  // Skip if disabled or same language
  const shouldTranslate = enabled && targetLang !== sourceLang && sourceText.length > 0;

  // Use batched translation (it handles cache checking internally)
  const batchTranslation = useTranslationBatch(sourceText, {
    sourceLang,
    targetLang,
    context,
    enabled: shouldTranslate,
  });

  // Sync batch translation state to our state
  // Only update when actual values change, not when object reference changes
  useEffect(() => {
    if (!shouldTranslate) {
      setTranslationState(prev => {
        if (prev.text === sourceText && !prev.isTranslating && !prev.isFromCache && !prev.error) {
          return prev; // No change needed
        }
        return {
        text: sourceText,
        isTranslating: false,
        isFromCache: false,
        error: null,
        retryCount: 0,
        };
      });
      return;
    }

    setTranslationState(prev => {
      // Only update if values actually changed
      if (
        prev.text === batchTranslation.text &&
        prev.isTranslating === batchTranslation.isTranslating &&
        prev.isFromCache === batchTranslation.isFromCache &&
        prev.error === batchTranslation.error
      ) {
        return prev; // No change needed
      }
      return {
        text: batchTranslation.text,
        isTranslating: batchTranslation.isTranslating,
        isFromCache: batchTranslation.isFromCache,
        error: batchTranslation.error,
        retryCount: 0,
      };
      });
  }, [batchTranslation.text, batchTranslation.isTranslating, batchTranslation.isFromCache, batchTranslation.error, sourceText, shouldTranslate]);

  // Manual retry function for failed translations
  const retryTranslation = useCallback(() => {
    if (translationState.error && shouldTranslate) {
      batchTranslation.retryTranslation();
    }
  }, [translationState.error, shouldTranslate, batchTranslation]);

  return {
    ...translationState,
    retryTranslation,
  };
}

/**
 * Hook to get user's language preference
 */
export function useLanguagePreference() {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;

  // Get user preferences from Convex
  const userPreferences = useQuery(
    api.userQueries.getUserPreferences,
    userId ? { userId } : 'skip'
  );

  const updatePreferences = useMutation(api.userMutations.updateUserPreferences);

  const language = userPreferences?.language || 'en';

  const setLanguage = useCallback(
    async (newLanguage: string) => {
      if (!userId) {
        // Guest user - save to localStorage only
        setStoredLanguage(newLanguage, 'manual');
        return;
      }

      // Authenticated user - save to Convex + localStorage (keep in sync)
      await updatePreferences({
        userId,
        preferences: {
          language: newLanguage,
        },
      });
      setStoredLanguage(newLanguage, 'manual');
    },
    [userId, updatePreferences]
  );

  return {
    language,
    setLanguage,
    isLoading: userPreferences === undefined,
  };
}

