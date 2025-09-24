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
  
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <div className="group relative inline-block max-w-full">
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="text-left select-none chat-font"
        style={{
          width: '100%',
          maxWidth: '310px',
          minHeight: '30px',
          height: 'auto',
          borderRadius: '6px',
          opacity: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '8px 12px',
          border: '0.6px solid #2A66CB',
          wordWrap: 'break-word',
          whiteSpace: 'normal',
          // Hover state styling - subtle blue tint on hover, no solid colors
          backgroundColor: isHovered ? 'rgba(42, 102, 203, 0.2)' : 'transparent',
          color: '#2A66CB',
          transition: 'all 150ms ease-out',
          cursor: 'pointer',
        }}
      >
        <span className="text-sm leading-relaxed break-words w-full text-left">
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