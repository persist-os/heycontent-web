import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

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
    sm: 'w-3 h-3 p-1',
    md: 'w-4 h-4 p-1.5',
    lg: 'w-5 h-5 p-2'
  };

  const variantClasses = {
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-700',
    outline: 'border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700',
    subtle: 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        inline-flex items-center gap-1.5 rounded-md transition-all duration-200
        ${sizeClasses[size]} ${variantClasses[variant]}
        ${copied ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}
        hover:text-gray-700 dark:hover:text-gray-300
        ${className}
      `}
      title={copied ? 'Copied!' : tooltipText}
      disabled={copied}
    >
      {copied ? (
        <Check className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
      ) : (
        <Copy className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
      )}
      {showText && (
        <span className="text-xs font-medium">
          {copied ? 'Copied' : 'Copy'}
        </span>
      )}
    </button>
  );
}; 