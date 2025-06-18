import React, { useState } from 'react';
import { Edit3, Check } from 'lucide-react';

interface InputButtonProps {
  text: string;
  onInputPopulate: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'subtle';
  showText?: boolean;
  tooltipText?: string;
}

export const InputButton: React.FC<InputButtonProps> = ({
  text,
  onInputPopulate,
  className = '',
  size = 'sm',
  variant = 'ghost',
  showText = false,
  tooltipText = 'Input to chat'
}) => {
  const [populated, setPopulated] = useState(false);

  const handleInputPopulate = () => {
    onInputPopulate(text);
    setPopulated(true);
    setTimeout(() => setPopulated(false), 2000);
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
      onClick={(e) => {
        e.stopPropagation(); // Prevent event bubbling to parent buttons
        handleInputPopulate();
      }}
      className={`
        inline-flex items-center gap-1.5 rounded-md transition-all duration-200
        ${sizeClasses[size]} ${variantClasses[variant]}
        ${populated ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}
        hover:text-gray-700 dark:hover:text-gray-300
        ${className}
      `}
      title={populated ? 'Added to input!' : tooltipText}
      disabled={populated}
    >
      {populated ? (
        <Check className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
      ) : (
        <Edit3 className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
      )}
      {showText && (
        <span className="text-xs font-medium">
          {populated ? 'Added' : 'Input'}
        </span>
      )}
    </button>
  );
}; 