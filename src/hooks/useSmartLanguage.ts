import { useLanguageContext } from '@/app/context/language-context';

export type { LanguageSource } from '@/app/context/language-context';

export interface SmartLanguageResult {
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  source: 'auth' | 'manual' | 'auto' | 'default';
  isAutoDetected: boolean;
  isLoading: boolean;
}

/**
 * Smart language detection with priority hierarchy:
 * 1. Authenticated user preference (Convex) - highest authority
 * 2. Manual localStorage override - user explicitly chose
 * 3. Browser auto-detection - smart default
 * 4. English fallback - ultimate safe default
 * 
 * This hook is now a thin wrapper around the LanguageContext
 * to ensure all components share the same language state.
 */
export function useSmartLanguage(): SmartLanguageResult {
  return useLanguageContext();
}
