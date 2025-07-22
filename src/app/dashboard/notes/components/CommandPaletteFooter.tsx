import React from 'react';
import { OperationState } from '../hooks/useOperationState';
import { RefinementState } from '../hooks/useRefinementState';
import { useRotatingLoadingMessage } from '../../../../lib/loading-messages';

interface CommandPaletteFooterProps {
  operationState: OperationState;
  refinementState: RefinementState;
}

export function CommandPaletteFooter({
  operationState,
  refinementState
}: CommandPaletteFooterProps) {
  const loadingMessage = useRotatingLoadingMessage(2500);
  
  const getLeftContent = () => {
    if (operationState.isOperationInProgress || operationState.completedCommandId || refinementState.isProcessingRefinement) {
      return (
        <div className="flex items-center gap-2">
          {operationState.isOperationInProgress || refinementState.isProcessingRefinement ? (
            <span>{loadingMessage}</span>
          ) : (
            <span className="text-green-600 dark:text-green-400">
              {operationState.operationType === 'generation' ? 'Content added to your note!' : 'Text successfully refined!'}
            </span>
          )}
        </div>
      );
    }
    
    if (refinementState.showInternalPreview) {
      return (
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↵</kbd>
            accept
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">r</kbd>
            retry
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌫</kbd>
            back
          </span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↑↓</kbd>
          to navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↵</kbd>
          to select
        </span>
      </div>
    );
  };

  const getEscapeText = () => {
    if (refinementState.showInternalPreview) {
      return 'back / close';
    }
    return 'to close';
  };

  return (
    <div className="px-3 py-2 border-t border-border bg-muted/5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {getLeftContent()}
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">esc</kbd>
          {getEscapeText()}
        </span>
      </div>
    </div>
  );
} 