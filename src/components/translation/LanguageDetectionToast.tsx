'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dismissLanguageToast } from '@/lib/language-utils';
import { T } from '@/components/translation';

interface LanguageDetectionToastProps {
  detectedLanguage: string;
  languageName: string;
  onConfirm: () => void;
  onSwitchToEnglish: () => void;
  onDismiss: () => void;
}

/**
 * Toast notification shown when language is auto-detected
 * Allows user to confirm or switch to English
 */
export function LanguageDetectionToast({
  detectedLanguage,
  languageName,
  onConfirm,
  onSwitchToEnglish,
  onDismiss,
}: LanguageDetectionToastProps) {
  
  const handleDismiss = () => {
    dismissLanguageToast();
    onDismiss();
  };

  const handleConfirm = () => {
    dismissLanguageToast();
    onConfirm();
  };

  const handleSwitchToEnglish = () => {
    dismissLanguageToast();
    onSwitchToEnglish();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-50 max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                <T context="language.toast.title">We noticed you speak {languageName}</T>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <T context="language.toast.description">Continue in {languageName}? The interface will translate as you explore.</T>
              </p>
              
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  className="flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span><T context="language.toast.confirm">Yes, continue</T></span>
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSwitchToEnglish}
                >
                  <T context="language.toast.switch">Use English</T>
                </Button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Dismiss language notification"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

