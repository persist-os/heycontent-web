'use client';

import React, { useState, useEffect } from 'react';
import { useLanguageContext } from '@/app/context/language-context';
import { shouldShowLanguageToast } from '@/lib/language-utils';
import { LanguageDetectionToast } from './LanguageDetectionToast';

// Language names mapping for toast display
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  ko: 'Korean (한국어)',
  ja: 'Japanese (日本語)',
  zh: 'Chinese (中文)',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  de: 'German (Deutsch)',
  it: 'Italian (Italiano)',
  pt: 'Portuguese (Português)',
  ru: 'Russian (Русский)',
  ar: 'Arabic (العربية)',
  hi: 'Hindi (हिन्दी)',
  th: 'Thai (ไทย)',
  vi: 'Vietnamese (Tiếng Việt)',
  id: 'Indonesian (Bahasa Indonesia)',
};

/**
 * Wrapper component to handle language auto-detection on app load
 * Shows toast if language was auto-detected (client-side only)
 */
export function LanguageDetectionWrapper({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, isAutoDetected } = useLanguageContext();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Only show toast if language was auto-detected and user hasn't dismissed
    if (isAutoDetected && shouldShowLanguageToast()) {
      console.log('[LanguageDetectionWrapper] Showing toast for auto-detected language:', language);
      setShowToast(true);
    }
  }, [isAutoDetected, language]);

  const handleConfirm = () => {
    console.log('[LanguageDetectionWrapper] User confirmed language:', language);
    setShowToast(false);
    // Language is already set, just dismiss toast
  };

  const handleSwitchToEnglish = async () => {
    console.log('[LanguageDetectionWrapper] User switching to English');
    setShowToast(false);
    await setLanguage('en');
  };

  const handleDismiss = () => {
    console.log('[LanguageDetectionWrapper] User dismissed toast');
    setShowToast(false);
  };

  return (
    <>
      {showToast && (
        <LanguageDetectionToast
          detectedLanguage={language}
          languageName={LANGUAGE_NAMES[language] || language}
          onConfirm={handleConfirm}
          onSwitchToEnglish={handleSwitchToEnglish}
          onDismiss={handleDismiss}
        />
      )}
      {children}
    </>
  );
}

