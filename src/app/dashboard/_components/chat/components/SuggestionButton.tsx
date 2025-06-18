import React from 'react';
import { InputButton } from '@/components/ui/input-button';

interface SuggestionButtonProps {
  suggestion: string;
  onClick: () => void;
  className?: string;
  variant?: 'default' | 'blue' | 'gray';
  onInputPopulate?: (text: string) => void;
}

export const SuggestionButton: React.FC<SuggestionButtonProps> = ({
  suggestion,
  onClick,
  className = '',
  variant = 'default',
  onInputPopulate
}) => {
  const variantClasses = {
    default: 'px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
    blue: 'px-3 py-1 text-sm bg-white border border-[#D0ECFF] rounded text-[#4E87E3] hover:bg-[#D0ECFF] hover:text-[#4E87E3]',
    gray: 'px-3 py-1.5 text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full'
  };

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={`${variantClasses[variant]} transition-colors w-full ${className}`}
      >
        {suggestion}
      </button>
      
      {onInputPopulate && (
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mt-1 -mr-1">
          <InputButton
            text={suggestion}
            onInputPopulate={onInputPopulate}
            className="bg-white shadow-sm border border-gray-200"
            size="sm"
            variant="outline"
            tooltipText="Input suggestion to chat"
          />
        </div>
      )}
    </div>
  );
};
