/**
 * Translation Batching Service
 * 
 * Batches translation requests to reduce API calls and prevent rate limiting.
 * 
 * Flow:
 * 1. Components request translations via useTranslation hook
 * 2. Cache is checked first (instant if cached)
 * 3. Uncached translations are queued
 * 4. Queue is processed in batches every 100ms or when batch size reaches 20
 * 5. Batch API call translates all queued texts at once
 * 6. Results are saved to cache and distributed to waiting components
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { fetchWithApiKey } from '@/app/lib/api-helpers';

// Batch configuration
const BATCH_SIZE = 20; // Max texts per batch (backend supports 50, but we use 20 for safety)
const BATCH_DELAY = 100; // Milliseconds to wait before processing batch

interface QueuedTranslation {
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  context?: string;
  resolve: (text: string) => void;
  reject: (error: Error) => void;
}

class TranslationBatcher {
  private queue: QueuedTranslation[] = [];
  private timeoutId: NodeJS.Timeout | null = null;
  private processing = false;

  /**
   * Queue a translation request
   */
  queueTranslation(
    sourceText: string,
    sourceLang: string,
    targetLang: string,
    context: string | undefined
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        sourceText,
        sourceLang,
        targetLang,
        context,
        resolve,
        reject,
      });

      // Process batch if it reaches size limit
      if (this.queue.length >= BATCH_SIZE) {
        this.processBatch();
      } else if (!this.timeoutId && !this.processing) {
        // Schedule batch processing after delay
        this.timeoutId = setTimeout(() => {
          this.processBatch();
        }, BATCH_DELAY);
      }
    });
  }

  /**
   * Process queued translations in a batch
   */
  private async processBatch() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Extract batch from queue
    const batch = this.queue.splice(0, BATCH_SIZE);
    
    // Group by (sourceLang, targetLang, context) to create separate batches
    const batches = new Map<string, QueuedTranslation[]>();
    
    batch.forEach(item => {
      const key = `${item.sourceLang}:${item.targetLang}:${item.context || ''}`;
      if (!batches.has(key)) {
        batches.set(key, []);
      }
      batches.get(key)!.push(item);
    });

    // Process each grouped batch
    const batchEntries = Array.from(batches.entries());
    for (const [key, items] of batchEntries) {
      const [sourceLang, targetLang, contextStr] = key.split(':');
      const context = contextStr || undefined;
      
      const texts = items.map(item => item.sourceText);
      
      try {
        // For guest users, make unauthenticated request (translations are public)
        const apiKey = await import('@/app/lib/api-helpers').then(m => m.getApiKey().catch(() => null));
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
        
        const response = await fetch('/api/translations/translate-batch', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            texts,
            sourceLang,
            targetLang,
            context,
          }),
        });

        if (!response.ok) {
          throw new Error(`Batch translation failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success || !data.translations || data.translations.length !== texts.length) {
          throw new Error(data.error || 'Batch translation returned invalid response');
        }

        // Resolve all promises with corresponding translations
        items.forEach((item, index) => {
          item.resolve(data.translations[index]);
        });
      } catch (error) {
        // Reject all items in this batch
        items.forEach(item => {
          item.reject(error instanceof Error ? error : new Error(String(error)));
        });
      }
    }

    this.processing = false;

    // Process remaining queue if any
    if (this.queue.length > 0) {
      if (this.queue.length >= BATCH_SIZE) {
        this.processBatch();
      } else {
        this.timeoutId = setTimeout(() => {
          this.processBatch();
        }, BATCH_DELAY);
      }
    }
  }

  /**
   * Clear queue (useful for cleanup)
   */
  clear() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.queue = [];
    this.processing = false;
  }
}

// Singleton instance
const translationBatcher = new TranslationBatcher();

/**
 * Hook for batched translation with cache-first approach
 * 
 * Flow:
 * 1. Check Convex cache first (instant if cached)
 * 2. If not cached, queue for batch translation
 * 3. Batch processor translates multiple texts in one API call
 * 4. Results saved to cache and returned to components
 */
export function useTranslationBatch(
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

  const [translationState, setTranslationState] = useState<{
    text: string;
    isTranslating: boolean;
    isFromCache: boolean;
    error: string | null;
  }>({
    text: sourceText,
    isTranslating: false,
    isFromCache: false,
    error: null,
  });

  // Skip if disabled or same language
  const shouldTranslate = enabled && targetLang !== sourceLang && sourceText.length > 0;

  // Check Convex cache first
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

  // Handle cache result and queue batch translation if needed
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
      // Not in cache - queue for batch translation
      setTranslationState(prev => ({
        ...prev,
        isTranslating: true,
        error: null,
      }));

      translationBatcher
        .queueTranslation(sourceText, sourceLang, targetLang, context)
        .then(async (translatedText) => {
          // Save to cache
          await saveTranslation({
            sourceText,
            sourceLang,
            targetLang,
            translatedText,
            translationMethod: 'ai',
            context,
            translatedBy: firebaseUser?.uid,
          });

          setTranslationState({
            text: translatedText,
            isTranslating: false,
            isFromCache: false,
            error: null,
          });
        })
        .catch((error) => {
          setTranslationState(prev => ({
            ...prev,
            isTranslating: false,
            error: error.message || 'Translation failed',
          }));
        });
    } else {
      // Found in cache - use it!
      setTranslationState({
        text: cachedTranslation.translatedText,
        isTranslating: false,
        isFromCache: true,
        error: null,
      });
    }
  }, [cachedTranslation, sourceText, sourceLang, targetLang, context, shouldTranslate, saveTranslation, firebaseUser]);

  // Manual retry function
  const retryTranslation = useCallback(() => {
    if (translationState.error && shouldTranslate) {
      setTranslationState(prev => ({
        ...prev,
        isTranslating: true,
        error: null,
      }));

      translationBatcher
        .queueTranslation(sourceText, sourceLang, targetLang, context)
        .then(async (translatedText) => {
          await saveTranslation({
            sourceText,
            sourceLang,
            targetLang,
            translatedText,
            translationMethod: 'ai',
            context,
            translatedBy: firebaseUser?.uid,
          });

          setTranslationState({
            text: translatedText,
            isTranslating: false,
            isFromCache: false,
            error: null,
          });
        })
        .catch((error) => {
          setTranslationState(prev => ({
            ...prev,
            isTranslating: false,
            error: error.message || 'Translation failed',
          }));
        });
    }
  }, [translationState.error, shouldTranslate, sourceText, sourceLang, targetLang, context, saveTranslation, firebaseUser]);

  return {
    ...translationState,
    retryTranslation,
  };
}

