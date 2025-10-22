import React, { useRef, useEffect } from 'react';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { ModeSelector } from './ModeSelector';
import { OperationState } from '../hooks/useOperationState';
import { RefinementState } from '../hooks/useRefinementState';
import { NOTE_TYPE_ICONS } from './InlineCommandPalette.constants';
import { NoteType as RefinementNoteType } from '../utils/refinement-configs';
import { useTranslation } from '@/hooks/useTranslation';

interface CommandPaletteHeaderProps {
  operationState: OperationState;
  refinementState: RefinementState;
  refinementMode: boolean;
  selectedText: string;
  noteType: string;
  selectedNoteTypeForCommands: RefinementNoteType | 'all';
  onNoteTypeSelect: (noteType: RefinementNoteType | 'all') => void;
  // New props for input functionality
  userInput: string;
  onUserInputChange: (value: string) => void;
  onCustomInputExecute: (input: string) => void;
  isOpen: boolean;
}

export function CommandPaletteHeader({
  operationState,
  refinementState,
  refinementMode,
  selectedText,
  noteType,
  selectedNoteTypeForCommands,
  onNoteTypeSelect,
  userInput,
  onUserInputChange,
  onCustomInputExecute,
  isOpen
}: CommandPaletteHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Translation hooks for all placeholder texts
  const { text: refiningText } = useTranslation('Refining text...', { context: 'commandpalette.placeholder.refining' });
  const { text: generatingText } = useTranslation('Generating content...', { context: 'commandpalette.placeholder.generating' });
  const { text: processingText } = useTranslation('Processing...', { context: 'commandpalette.placeholder.processing' });
  const { text: generatedText } = useTranslation('Content generated!', { context: 'commandpalette.placeholder.generated' });
  const { text: refinedText } = useTranslation('Text refined!', { context: 'commandpalette.placeholder.refined' });
  const { text: previewText } = useTranslation('Refinement Preview', { context: 'commandpalette.placeholder.preview' });
  const { text: refinePrefix } = useTranslation('Refine:', { context: 'commandpalette.placeholder.refineprefix' });
  const { text: createText } = useTranslation('What would you like to create?', { context: 'commandpalette.placeholder.create' });

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current && !refinementState.showInternalPreview) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, refinementState.showInternalPreview]);

  // Reset input when mode changes
  useEffect(() => {
    onUserInputChange('');
  }, [refinementMode, selectedNoteTypeForCommands, onUserInputChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (userInput.trim()) {
        onCustomInputExecute(userInput.trim());
      }
    }
  };

  const getPlaceholder = () => {
    if (operationState.isOperationInProgress || refinementState.isProcessingRefinement) {
      return refinementState.previewTransition === 'loading' ? refiningText :
             operationState.operationType === 'generation' ? generatingText : 
             processingText;
    }
    
    if (operationState.completedCommandId) {
      return operationState.operationType === 'generation' ? generatedText : refinedText;
    }
    
    if (refinementState.showInternalPreview) {
      return previewText;
    }
    
    if (refinementMode) {
      return `${refinePrefix} "${selectedText.slice(0, 30)}${selectedText.length > 30 ? '...' : ''}"`; 
    }
    
    return createText;
  };

  const showModeSelector = !operationState.isOperationInProgress && 
                          !operationState.completedCommandId && 
                          !refinementState.showInternalPreview;

  const showInput = !operationState.isOperationInProgress && 
                   !operationState.completedCommandId && 
                   !refinementState.showInternalPreview;

  return (
    <div className="p-3 border-b border-border">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Sparkles className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {showInput ? (
            <div className="flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => onUserInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                className="w-full px-2 py-1 text-sm bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground"
                disabled={operationState.isOperationInProgress || refinementState.isProcessingRefinement}
              />
            </div>
          ) : (
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              {operationState.isOperationInProgress || refinementState.isProcessingRefinement ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {getPlaceholder()}
                </>
              ) : operationState.completedCommandId ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">{getPlaceholder()}</span>
                </>
              ) : (
                getPlaceholder()
              )}
            </span>
          )}
        </div>
        {showModeSelector && (
          <ModeSelector
            currentNoteType={noteType as RefinementNoteType}
            selectedNoteType={selectedNoteTypeForCommands}
            availableNoteTypes={Object.keys(NOTE_TYPE_ICONS) as RefinementNoteType[]}
            onNoteTypeSelect={onNoteTypeSelect}
            mode={refinementMode ? 'refinement' : 'generation'}
          />
        )}
      </div>
    </div>
  );
} 