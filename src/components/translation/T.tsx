'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation, useLanguagePreference } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';

interface TProps {
  children: React.ReactNode;
  context?: string;
  sourceLang?: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Translation component with progressive, magical transformation
 * 
 * Usage:
 * <T>Hello, world!</T>
 * <T context="button.save">Save</T>
 * <T as="h1">Welcome to HeyContext</T>
 * 
 * Features:
 * - Cache-first (instant if already translated)
 * - Progressive translation (shows English, then transforms)
 * - Smooth fade animation
 * - Extracts text from React children
 */
export function T({
  children,
  context,
  sourceLang = 'en',
  className = '',
  as: Component = 'span',
}: TProps) {
  const { language } = useLanguagePreference();
  
  // Extract text from children
  const sourceText = extractText(children);
  
  // Get translation
  const { text, isTranslating, isFromCache } = useTranslation(sourceText, {
    sourceLang,
    targetLang: language,
    context,
    enabled: true,
  });

  const [displayText, setDisplayText] = useState(sourceText);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (text !== displayText) {
      setDisplayText(text);
      setKey(prev => prev + 1); // Trigger animation
    }
  }, [text, displayText]);

  // If same language or instant cache hit, no animation
  if (language === sourceLang || (isFromCache && displayText === text)) {
    return <Component className={className}>{displayText}</Component>;
  }

  // Progressive translation with smooth fade
  return (
    <Component className={className} style={{ display: 'inline-block' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={key}
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.3,
            ease: 'easeInOut',
          }}
        >
          {displayText}
        </motion.span>
      </AnimatePresence>
      {isTranslating && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          className="ml-1"
          style={{ fontSize: '0.8em' }}
        >
          ✨
        </motion.span>
      )}
    </Component>
  );
}

/**
 * Extract plain text from React children
 * Handles strings, numbers, and nested elements
 */
function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') {
    return children;
  }

  if (typeof children === 'number') {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(extractText).join('');
  }

  if (React.isValidElement(children)) {
    return extractText(children.props.children);
  }

  return '';
}

/**
 * Translation wrapper for headings
 */
export function THeading({ children, level = 1, ...props }: TProps & { level?: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  return <T as={Component} {...props}>{children}</T>;
}

/**
 * Translation wrapper for buttons
 */
export function TButton({ children, ...props }: TProps) {
  return <T context="button" {...props}>{children}</T>;
}

/**
 * Translation wrapper for paragraphs
 */
export function TParagraph({ children, ...props }: TProps) {
  return <T as="p" {...props}>{children}</T>;
}

