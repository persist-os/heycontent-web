import React from 'react';
import { Brain, MessageSquare, Target, Zap } from 'lucide-react';
import { SuggestedAction } from '../types';

interface SuggestionChipProps {
  suggestion: SuggestedAction | string;
  onClick: () => void;
}

// Utility function to clean bullet points from suggestions
const cleanSuggestionText = (text: string): string => {
  return text
    .replace(/^[\s]*[-*•]\s*/, '') // Remove leading bullet points (-, *, •)
    .replace(/^[\s]*\*\s*/, '') // Remove leading asterisks
    .trim();
};

export const SuggestionChip = ({ suggestion, onClick }: SuggestionChipProps) => {
  // Handle both string suggestions and structured SuggestedAction objects
  const isStringType = typeof suggestion === 'string';
  
  // Clean the suggestion text
  const displayText = isStringType 
    ? cleanSuggestionText(suggestion)
    : cleanSuggestionText((suggestion as SuggestedAction).description);
  
  return (
    <button
      onClick={onClick}
      className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg flex items-center gap-1 sm:gap-2 transition-colors max-w-full"
    >
      {!isStringType && (
        <>
          {(suggestion as SuggestedAction).type === 'explore' && <Brain className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
          {(suggestion as SuggestedAction).type === 'clarify' && <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
          {(suggestion as SuggestedAction).type === 'action' && <Zap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
          {(suggestion as SuggestedAction).type === 'strategic' && <Target className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
        </>
      )}
      <span className="break-words min-w-0 text-left">
        {displayText}
      </span>
    </button>
  );
};