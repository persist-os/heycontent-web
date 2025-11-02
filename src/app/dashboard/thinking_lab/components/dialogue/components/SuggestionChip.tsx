import React from 'react';
import { Brain, MessageSquare, Target, Zap } from 'lucide-react';
import { SuggestedAction } from '../../../types/modules/dialogueModules';
import { InputButton } from '@/components/ui/input-button';
import { cn } from '@/lib/utils';

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
  const [isMounted, setIsMounted] = React.useState(false);
  
  // Trigger fade+slide animation immediately on mount
  React.useEffect(() => {
    requestAnimationFrame(() => {
      setIsMounted(true);
    });
  }, []);
  
  return (
    <div 
      className="group relative inline-block max-w-full transition-all duration-300 ease-out"
      style={{
        opacity: isMounted ? 1 : 0,
        transform: isMounted ? 'translateY(0)' : 'translateY(10px)'
      }}
    >
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "text-left select-none chat-font",
          "w-full max-w-[310px] min-h-[30px] h-auto rounded-lg",
          "flex items-center justify-start px-3.5 py-2",
          "border border-primary/30 dark:border-primary/40",
          "break-words whitespace-normal",
          "transition-all duration-150 ease-out cursor-pointer",
          "text-primary-darker dark:text-primary",
          isHovered 
            ? "bg-primary/20 dark:bg-primary/15" 
            : "bg-primary/10 dark:bg-primary/5"
        )}
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