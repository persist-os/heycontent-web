/**
 * Language detection and localStorage utilities
 * Supports smart language detection for unauthenticated users
 */

export interface LanguagePreference {
  lang: string;
  source: 'manual' | 'auto';
  detectedAt: number;
}

const STORAGE_KEY = 'heycontext_language_preference';
const TOAST_DISMISSED_KEY = 'heycontext_language_toast_dismissed';

// Supported languages (ISO 639-1 codes)
export const SUPPORTED_LANGUAGES = [
  'en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'it', 'pt', 'ru',
  'ar', 'hi', 'th', 'vi', 'id', 'tr', 'pl', 'nl', 'sv', 'no',
  'da', 'fi', 'cs', 'hu', 'ro', 'uk', 'el', 'he', 'fa', 'bn',
  'ta', 'te', 'mr', 'ur', 'ms', 'fil'
];

/**
 * Detect browser's preferred language
 * Returns first supported language or 'en' as fallback
 */
export function detectBrowserLanguage(): string {
  if (typeof window === 'undefined') return 'en';

  const langs = navigator.languages || [navigator.language];

  for (const lang of langs) {
    const normalized = lang.split('-')[0].toLowerCase();
    if (SUPPORTED_LANGUAGES.includes(normalized)) {
      return normalized;
    }
  }

  return 'en';
}

/**
 * Get stored language preference from localStorage
 */
export function getStoredLanguage(): LanguagePreference | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Save language preference to localStorage
 */
export function setStoredLanguage(lang: string, source: 'manual' | 'auto'): void {
  if (typeof window === 'undefined') return;

  try {
    const preference: LanguagePreference = {
      lang,
      source,
      detectedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
  } catch (error) {
    console.error('[Language] Failed to save preference:', error);
  }
}

/**
 * Check if language detection toast should be shown
 */
export function shouldShowLanguageToast(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const dismissed = localStorage.getItem(TOAST_DISMISSED_KEY);
    const pref = getStoredLanguage();

    // Show if not dismissed AND language was auto-detected AND not English
    return !dismissed && pref?.source === 'auto' && pref?.lang !== 'en';
  } catch {
    return false;
  }
}

/**
 * Mark language detection toast as dismissed
 */
export function dismissLanguageToast(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(TOAST_DISMISSED_KEY, 'true');
  } catch (error) {
    console.error('[Language] Failed to dismiss toast:', error);
  }
}

/**
 * Clear all language preferences (for testing)
 */
export function clearLanguagePreferences(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOAST_DISMISSED_KEY);
  } catch (error) {
    console.error('[Language] Failed to clear preferences:', error);
  }
}

