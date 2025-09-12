import React from 'react';
import { Brain, MessageSquare, Target, Zap } from 'lucide-react';
import { SuggestedAction } from '../../types';
import { InputButton } from '@/components/ui/input-button';

interface SuggestionChipProps {
  suggestion: SuggestedAction | string;
  onClick: () => void;
  onInputPopulate?: (text: string) => void;
}

// Utility function to clean bullet points from suggestions
const cleanSuggestionText = (text: string): string => {
  return text
    .replace(/^[\s]*[-*•]\s*/, '') // Remove leading bullet points (-, *, •)
    .replace(/^[\s]*\*\s*/, '') // Remove leading asterisks
    .trim();
};

export const SuggestionChip = ({ suggestion, onClick, onInputPopulate }: SuggestionChipProps) => {
  // Handle both string suggestions and structured SuggestedAction objects
  const isStringType = typeof suggestion === 'string';
  
  // Clean the suggestion text
  const displayText = isStringType 
    ? cleanSuggestionText(suggestion)
    : cleanSuggestionText((suggestion as SuggestedAction).description);
  
  return (
    <div className="group relative inline-block">
      <button
        onClick={onClick}
        className="text-left transition-all duration-300 hover:scale-105 select-none chat-font"
      >
        <span className="text-sm text-primary/80 hover:text-primary underline underline-offset-4 
          decoration-primary/30 hover:decoration-primary/60 transition-all duration-300 
          decoration-dotted hover:decoration-solid break-words leading-relaxed">
          {displayText}
        </span>
      </button>
      
      {/* Input button - minimal and unobtrusive */}
      {onInputPopulate && (
        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <InputButton
            text={displayText}
            onInputPopulate={onInputPopulate}
            tooltipText="Add to input"
          />
        </div>
      )}
    </div>
  );
};