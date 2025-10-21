import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { fetchWithApiKey } from '@/app/lib/api-helpers';
import type { TranslateRequest } from '@/convex/types/translation';
import type { UserPreferences } from '@/convex/types/user';

export interface TranslationState {
  text: string;
  isTranslating: boolean;
  isFromCache: boolean;
  error: string | null;
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

  // Translate using backend AI
  const translateWithAI = useCallback(async () => {
    if (!shouldTranslate) return;

    setTranslationState(prev => ({
      ...prev,
      isTranslating: true,
      error: null,
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
        throw new Error('Translation failed');
      }

      const data = await response.json();
      const translatedText = data.translatedText;

      // Smooth transition to translated text
      setTranslationState({
        text: translatedText,
        isTranslating: false,
        isFromCache: false,
        error: null,
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
      console.error('Translation error:', error);
      setTranslationState(prev => ({
        ...prev,
        isTranslating: false,
        error: 'Translation failed',
      }));
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
      });
    }
  }, [cachedTranslation, sourceText, shouldTranslate, translateWithAI]);

  return translationState;
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
      if (!userId) return;

      await updatePreferences({
        userId,
        preferences: {
          language: newLanguage,
        },
      });
    },
    [userId, updatePreferences]
  );

  return {
    language,
    setLanguage,
    isLoading: userPreferences === undefined,
  };
}

