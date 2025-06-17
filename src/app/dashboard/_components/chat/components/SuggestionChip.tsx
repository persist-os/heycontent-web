import React from 'react';
import { Brain, MessageSquare, Target, Zap } from 'lucide-react';
import { SuggestedAction } from '../types';
import { CopyButton } from '@/components/ui/copy-button';

interface SuggestionChipProps {
  suggestion: SuggestedAction | string;
  onClick: () => void;
}

export const SuggestionChip = ({ suggestion, onClick }: SuggestionChipProps) => {
  // Handle both string suggestions and structured SuggestedAction objects
  const isStringType = typeof suggestion === 'string';
  const suggestionText = isStringType ? suggestion : (suggestion as SuggestedAction).description;
  
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className="px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full flex items-center gap-2 transition-colors w-full"
      >
        {!isStringType && (
          <>
            {(suggestion as SuggestedAction).type === 'explore' && <Brain className="w-4 h-4" />}
            {(suggestion as SuggestedAction).type === 'clarify' && <MessageSquare className="w-4 h-4" />}
            {(suggestion as SuggestedAction).type === 'action' && <Zap className="w-4 h-4" />}
            {(suggestion as SuggestedAction).type === 'strategic' && <Target className="w-4 h-4" />}
          </>
        )}
        {suggestionText}
      </button>
      
      {/* Copy button - appears on hover */}
      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mt-1 -mr-1">
        <CopyButton
          text={suggestionText}
          className="bg-white shadow-sm border border-gray-200"
          size="md"
          variant="outline"
          tooltipText="Copy suggestion"
        />
      </div>
    </div>
  );
};