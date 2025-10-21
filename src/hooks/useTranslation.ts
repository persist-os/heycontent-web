import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { fetchWithApiKey } from '@/app/lib/api-helpers';
import type { TranslateRequest } from '@/convex/types/translation';
import type { UserPreferences } from '@/convex/types/user';
import { setStoredLanguage } from '@/lib/language-utils';

export interface TranslationState {
  text: string;
  isTranslating: boolean;
  isFromCache: boolean;
  error: string | null;
  retryCount?: number;
}

/**
 * Hook for progressive translation with cache-first approach
 * 
 * Flow:
 * 1. Check Convex cache
 * 2. If cached → return instantly
 * 3. If not cached → show original, trigger AI translation
 * 4. AI translates → smooth fade to translated text
 * 5. Save to cache for future users
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

  // Check Convex cache
  const cachedTranslation = useQuery(
    api.translationQueries.getTranslation,
    shouldTranslate
      ? {
          sourceText,
          sourceLang,
          targetLang,
        }
      : 'skip'
  );

  // Mutation to save translation
  const saveTranslation = useMutation(api.translationMutations.saveTranslation);

  // Translate using backend AI with retry logic
  const translateWithAI = useCallback(async (retryCount = 0) => {
    if (!shouldTranslate) return;

    const maxRetries = 3;
    const baseDelay = 1000; // 1 second base delay

    setTranslationState(prev => ({
      ...prev,
      isTranslating: true,
      error: null,
      retryCount,
    }));

    try {
      const response = await fetchWithApiKey('/api/translations/translate', {
        method: 'POST',
        body: JSON.stringify({
          sourceText,
          sourceLang,
          targetLang,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const translatedText = data.translatedText;

      // Smooth transition to translated text
      setTranslationState({
        text: translatedText,
        isTranslating: false,
        isFromCache: false,
        error: null,
        retryCount: 0,
      });

      // Save to Convex cache
      await saveTranslation({
        sourceText,
        sourceLang,
        targetLang,
        translatedText,
        translationMethod: 'ai',
        context,
        translatedBy: firebaseUser?.uid,
      });
    } catch (error) {
      console.error(`Translation error (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, retryCount);
        console.log(`Retrying translation in ${delay}ms...`);
        
        setTimeout(() => {
          translateWithAI(retryCount + 1);
        }, delay);
      } else {
        // Max retries exceeded
        setTranslationState(prev => ({
          ...prev,
          isTranslating: false,
          error: `Translation failed after ${maxRetries + 1} attempts`,
          retryCount: 0,
        }));
      }
    }
  }, [
    sourceText,
    sourceLang,
    targetLang,
    context,
    shouldTranslate,
    saveTranslation,
    firebaseUser,
  ]);

  // Handle cache result
  useEffect(() => {
    if (!shouldTranslate) {
      setTranslationState({
        text: sourceText,
        isTranslating: false,
        isFromCache: false,
        error: null,
        retryCount: 0,
      });
      return;
    }

    if (cachedTranslation === undefined) {
      // Loading from Convex
      return;
    }

    if (cachedTranslation === null) {
      // Not in cache - trigger AI translation
      translateWithAI();
    } else {
      // Found in cache - use it!
      setTranslationState({
        text: cachedTranslation.translatedText,
        isTranslating: false,
        isFromCache: true,
        error: null,
        retryCount: 0,
      });
    }
  }, [cachedTranslation, sourceText, shouldTranslate, translateWithAI]);

  // Manual retry function for failed translations
  const retryTranslation = useCallback(() => {
    if (translationState.error && shouldTranslate) {
      translateWithAI(0); // Reset retry count
    }
  }, [translationState.error, shouldTranslate, translateWithAI]);

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

