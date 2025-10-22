import React from 'react';
import { OperationState } from '../hooks/useOperationState';
import { RefinementState } from '../hooks/useRefinementState';
import { useRotatingLoadingMessage } from '../../../../lib/loading-messages';
import { T } from '@/components/translation/T';

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
              {operationState.operationType === 'generation' ? (
                <T context="commandpalette.success">Content added to your note!</T>
              ) : (
                <T context="commandpalette.success">Text successfully refined!</T>
              )}
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
            <T context="commandpalette.shortcut">accept</T>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">r</kbd>
            <T context="commandpalette.shortcut">retry</T>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌫</kbd>
            <T context="commandpalette.shortcut">back</T>
          </span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↑↓</kbd>
          <T context="commandpalette.shortcut">to navigate</T>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↵</kbd>
          <T context="commandpalette.shortcut">to select</T>
        </span>
      </div>
    );
  };

  const getEscapeText = () => {
    if (refinementState.showInternalPreview) {
      return <T context="commandpalette.shortcut">back / close</T>;
    }
    return <T context="commandpalette.shortcut">to close</T>;
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