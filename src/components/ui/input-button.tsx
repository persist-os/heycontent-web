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
  tooltipText = 'Add to input'
}) => {
  const [populated, setPopulated] = useState(false);

  const handleInputPopulate = () => {
    onInputPopulate(text);
    setPopulated(true);
    setTimeout(() => setPopulated(false), 2000);
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Prevent event bubbling to parent buttons
        handleInputPopulate();
      }}
      className={`
        opacity-60 hover:opacity-100 transition-opacity duration-200 
        p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700
        ${populated ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}
        ${className}
      `}
      title={populated ? 'Added to input!' : tooltipText}
      disabled={populated}
    >
      {populated ? (
        <Check className="w-4 h-4" />
      ) : (
        <Edit3 className="w-4 h-4" />
      )}
      {showText && (
        <span className="text-xs font-medium ml-1">
          {populated ? 'Added' : 'Input'}
        </span>
      )}
    </button>
  );
}; 