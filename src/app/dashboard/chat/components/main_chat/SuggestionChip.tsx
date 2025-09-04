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
    <div className="group relative">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium  
          bg-primary text-primary-foreground dark:text-black hover:bg-primary/90 hover:text-primary-foreground dark:hover:text-black
          rounded-lg transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 
          active:translate-y-0 active:shadow-none select-none max-w-full chat-font break-words"
      >
        {!isStringType && (
          <span className="text-primary-foreground dark:text-black group-hover:text-primary-foreground dark:group-hover:text-black transition-colors duration-200">
            {(suggestion as SuggestedAction).type === 'explore' && <Brain className="w-3.5 h-3.5 flex-shrink-0" />}
            {(suggestion as SuggestedAction).type === 'clarify' && <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />}
            {(suggestion as SuggestedAction).type === 'action' && <Zap className="w-3.5 h-3.5 flex-shrink-0" />}
            {(suggestion as SuggestedAction).type === 'strategic' && <Target className="w-3.5 h-3.5 flex-shrink-0" />}
          </span>
        )}
        <span className="break-words min-w-0 text-left whitespace-normal">
          {displayText}
        </span>
      </button>
      
      {/* Input button - appears on hover */}
      {onInputPopulate && (
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mt-1 -mr-1">
          <InputButton
            text={displayText}
            onInputPopulate={onInputPopulate}
            tooltipText="Add suggestion to input"
          />
        </div>
      )}
    </div>
  );
};