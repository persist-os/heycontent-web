import React, { useRef, useEffect } from 'react';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { ModeSelector } from './ModeSelector';
import { OperationState } from '../hooks/useOperationState';
import { RefinementState } from '../hooks/useRefinementState';
import { NOTE_TYPE_ICONS } from './InlineCommandPalette.constants';
import { NoteType as RefinementNoteType } from '../utils/refinement-configs';

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
      return refinementState.previewTransition === 'loading' ? 'Refining text...' :
             operationState.operationType === 'generation' ? 'Generating content...' : 
             'Processing...';
    }
    
    if (operationState.completedCommandId) {
      return operationState.operationType === 'generation' ? 'Content generated!' : 'Text refined!';
    }
    
    if (refinementState.showInternalPreview) {
      return 'Refinement Preview';
    }
    
    if (refinementMode) {
      return `Refine: "${selectedText.slice(0, 30)}${selectedText.length > 30 ? '...' : ''}"`; 
    }
    
    return 'What would you like to create?';
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
              {userInput.trim() && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Press <kbd className="px-1 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">Enter</kbd> to {refinementMode ? 'refine' : 'generate'} with: "{userInput}"
                </div>
              )}
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