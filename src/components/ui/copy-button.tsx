import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from './button';
import { useLanguagePreference, useTranslation } from '@/hooks/useTranslation';

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'subtle';
  showText?: boolean;
  tooltipText?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  className = '',
  size = 'sm',
  variant = 'ghost',
  showText = false,
  tooltipText = 'Copy to clipboard'
}) => {
  const [copied, setCopied] = useState(false);
  const { language } = useLanguagePreference();
  
  const { text: copiedText } = useTranslation('Copied!', {
    context: 'button.copied',
    targetLang: language,
    enabled: true,
  });
  
  const { text: copyText } = useTranslation('Copy', {
    context: 'button.copy',
    targetLang: language,
    enabled: true,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const sizeClasses = {
    sm: 'p-1.5 rounded-full',
    md: 'w-7 h-7 p-2.5',
    lg: 'w-8 h-8 p-3'
  };

  const variantClasses = {
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-700',
    outline: 'border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700',
    subtle: 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
  };

  return (
    <Button
      variant="copy"
      size={size}
      onClick={(e) => {
        e.stopPropagation(); // Prevent event bubbling to parent buttons
        handleCopy();
      }}
      className={className}
      title={copied ? copiedText : tooltipText}
      disabled={copied}
    >
      {copied ? (
        <Check className={size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'} />
      ) : (
        <Copy className={size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'} />
      )}
      {showText && (
        <span className="text-xs font-medium">
          {copied ? copiedText : copyText}
        </span>
      )}
    </Button>
  );
}; 