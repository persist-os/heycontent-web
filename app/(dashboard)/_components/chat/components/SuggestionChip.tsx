import React from 'react';
import { Brain, MessageSquare, Target, Zap } from 'lucide-react';
import { SuggestedAction } from '../types';

interface SuggestionChipProps {
  suggestion: SuggestedAction;
  onClick: () => void;
}

export const SuggestionChip = ({ suggestion, onClick }: SuggestionChipProps) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full flex items-center gap-2 transition-colors"
  >
    {suggestion.type === 'explore' && <Brain className="w-4 h-4" />}
    {suggestion.type === 'clarify' && <MessageSquare className="w-4 h-4" />}
    {suggestion.type === 'action' && <Zap className="w-4 h-4" />}
    {suggestion.type === 'strategic' && <Target className="w-4 h-4" />}
    {suggestion.description}
  </button>
);
