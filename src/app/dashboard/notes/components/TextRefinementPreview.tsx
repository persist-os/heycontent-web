"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Check, RotateCcw, X, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { useRotatingLoadingMessage } from '../../../../lib/loading-messages';

interface TextRefinementPreviewProps {
  originalText: string;
  refinedText: string;
  onAccept: () => void | Promise<void>;
  onRetry: () => void | Promise<void>;
  onReject: () => void | Promise<void>;
  isProcessing?: boolean;
}

interface DiffChange {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

// Simple word-level diff algorithm
function calculateWordDiff(original: string, refined: string): DiffChange[] {
  const originalWords = original.split(/(\s+)/);
  const refinedWords = refined.split(/(\s+)/);
  
  const changes: DiffChange[] = [];
  let originalIndex = 0;
  let refinedIndex = 0;
  
  while (originalIndex < originalWords.length || refinedIndex < refinedWords.length) {
    if (originalIndex >= originalWords.length) {
      // Remaining words are additions
      changes.push({
        type: 'added',
        value: refinedWords[refinedIndex]
      });
      refinedIndex++;
    } else if (refinedIndex >= refinedWords.length) {
      // Remaining words are deletions
      changes.push({
        type: 'removed',
        value: originalWords[originalIndex]
      });
      originalIndex++;
    } else if (originalWords[originalIndex] === refinedWords[refinedIndex]) {
      // Words match
      changes.push({
        type: 'unchanged',
        value: originalWords[originalIndex]
      });
      originalIndex++;
      refinedIndex++;
    } else {
      // Look ahead to find matches
      let foundMatch = false;
      
      // Check if next few words in refined match current original
      for (let i = refinedIndex + 1; i < Math.min(refinedIndex + 5, refinedWords.length); i++) {
        if (refinedWords[i] === originalWords[originalIndex]) {
          // Found a match - mark intermediate words as additions
          for (let j = refinedIndex; j < i; j++) {
            changes.push({
              type: 'added',
              value: refinedWords[j]
            });
          }
          refinedIndex = i;
          foundMatch = true;
          break;
        }
      }
      
      if (!foundMatch) {
        // Check if next few words in original match current refined
        for (let i = originalIndex + 1; i < Math.min(originalIndex + 5, originalWords.length); i++) {
          if (originalWords[i] === refinedWords[refinedIndex]) {
            // Found a match - mark intermediate words as deletions
            for (let j = originalIndex; j < i; j++) {
              changes.push({
                type: 'removed',
                value: originalWords[j]
              });
            }
            originalIndex = i;
            foundMatch = true;
            break;
          }
        }
      }
      
      if (!foundMatch) {
        // No match found - treat as replacement
        changes.push({
          type: 'removed',
          value: originalWords[originalIndex]
        });
        changes.push({
          type: 'added',
          value: refinedWords[refinedIndex]
        });
        originalIndex++;
        refinedIndex++;
      }
    }
  }
  
  return changes;
}

export function TextRefinementPreview({
  originalText,
  refinedText,
  onAccept,
  onRetry,
  onReject,
  isProcessing = false
}: TextRefinementPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingMessage = useRotatingLoadingMessage(2500);
  
  // Enhanced state for UX
  const [operationState, setOperationState] = useState<{
    activeAction: 'accept' | 'retry' | 'reject' | null;
    isCompleting: boolean;
    showSuccess: boolean;
  }>({
    activeAction: null,
    isCompleting: false,
    showSuccess: false
  });
  
  // Calculate diff changes
  const diffChanges = React.useMemo(() => {
    if (isProcessing) return [];
    return calculateWordDiff(originalText, refinedText);
  }, [originalText, refinedText, isProcessing]);

  // Enhanced action handlers with loading states
  const handleAccept = async () => {
    if (operationState.isCompleting) return;
    
    setOperationState({
      activeAction: 'accept',
      isCompleting: true,
      showSuccess: false
    });

    try {
      await Promise.resolve(onAccept());
      setOperationState(prev => ({
        ...prev,
        isCompleting: false,
        showSuccess: true
      }));
      
      // Show success state briefly before closing
      setTimeout(() => {
        setOperationState({
          activeAction: null,
          isCompleting: false,
          showSuccess: false
        });
      }, 1000);
    } catch (error) {
      setOperationState({
        activeAction: null,
        isCompleting: false,
        showSuccess: false
      });
    }
  };

  const handleRetry = async () => {
    if (operationState.isCompleting) return;
    
    setOperationState({
      activeAction: 'retry',
      isCompleting: true,
      showSuccess: false
    });

    try {
      await Promise.resolve(onRetry());
      // Don't show success for retry, just reset
      setOperationState({
        activeAction: null,
        isCompleting: false,
        showSuccess: false
      });
    } catch (error) {
      setOperationState({
        activeAction: null,
        isCompleting: false,
        showSuccess: false
      });
    }
  };

  const handleReject = async () => {
    if (operationState.isCompleting) return;
    
    try {
      await Promise.resolve(onReject());
    } catch (error) {
      console.error('Failed to reject refinement:', error);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (operationState.isCompleting) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          handleReject();
        }
        return;
      }

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          e.stopPropagation();
          if (!isProcessing) handleAccept();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          e.stopPropagation();
          if (!isProcessing) handleRetry();
          break;
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          handleReject();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isProcessing, operationState.isCompleting]);

  // Count changes for summary
  const changeStats = React.useMemo(() => {
    const additions = diffChanges.filter(change => change.type === 'added').length;
    const deletions = diffChanges.filter(change => change.type === 'removed').length;
    return { additions, deletions };
  }, [diffChanges]);

  return (
    <div ref={containerRef} className="p-4 space-y-4">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-yellow-400" />
          <h3 className="text-sm font-medium text-foreground">
            {operationState.showSuccess ? (
              <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                Text refined successfully!
              </span>
            ) : operationState.isCompleting ? (
                              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {loadingMessage}
              </span>
            ) : (
              'Text Refinement Preview'
            )}
          </h3>
        </div>
        {!isProcessing && !operationState.isCompleting && !operationState.showSuccess && changeStats.additions + changeStats.deletions > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {changeStats.additions > 0 && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {changeStats.additions} added
              </span>
            )}
            {changeStats.deletions > 0 && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                {changeStats.deletions} removed
              </span>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Diff Display */}
      <div className={`rounded-md p-3 max-h-48 overflow-y-auto transition-all duration-200 ${
        operationState.showSuccess 
          ? 'bg-green-500/10 ring-2 ring-green-500/20' 
          : operationState.isCompleting
          ? 'bg-purple-500/10 dark:bg-yellow-500/10 ring-2 ring-purple-500/20 dark:ring-yellow-500/20'
          : 'bg-muted/30'
      }`}>
        {isProcessing ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingMessage}
          </div>
        ) : operationState.showSuccess ? (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4 animate-pulse" />
            Changes applied to your note!
          </div>
        ) : (
          <div 
            className="text-sm leading-relaxed"
            role="region"
            aria-label="Text refinement comparison"
          >
            {diffChanges.map((change, index) => {
              switch (change.type) {
                case 'added':
                  return (
                    <span
                      key={index}
                      className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-1 rounded"
                      aria-label={`Added text: ${change.value.trim()}`}
                      title="Added text"
                    >
                      {change.value}
                    </span>
                  );
                case 'removed':
                  return (
                    <span
                      key={index}
                      className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 line-through px-1 rounded opacity-75"
                      aria-label={`Removed text: ${change.value.trim()}`}
                      title="Removed text"
                    >
                      {change.value}
                    </span>
                  );
                case 'unchanged':
                default:
                  return (
                    <span key={index} className="text-foreground">
                      {change.value}
                    </span>
                  );
              }
            })}
          </div>
        )}
      </div>

      {/* Enhanced Action Controls */}
      {!isProcessing && !operationState.showSuccess && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleAccept}
            disabled={operationState.isCompleting}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 ${
              operationState.activeAction === 'accept'
                ? 'bg-green-600 text-white ring-2 ring-green-500/30'
                : operationState.isCompleting
                ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500/30'
            }`}
            aria-label="Accept refinement (Enter key)"
            title="Accept these changes"
          >
            {operationState.activeAction === 'accept' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Check className="w-3 h-3" />
            )}
            Accept
          </button>
          
          <button
            onClick={handleRetry}
            disabled={operationState.isCompleting}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 ${
              operationState.activeAction === 'retry'
                ? 'bg-yellow-600 text-white ring-2 ring-yellow-500/30'
                : operationState.isCompleting
                ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                : 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500/30'
            }`}
            aria-label="Retry refinement (R key)"
            title="Generate a different refinement"
          >
            {operationState.activeAction === 'retry' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RotateCcw className="w-3 h-3" />
            )}
            Retry
          </button>
          
          <button
            onClick={handleReject}
            disabled={operationState.isCompleting && operationState.activeAction !== 'reject'}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 ${
              operationState.isCompleting && operationState.activeAction !== 'reject'
                ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                : 'bg-muted hover:bg-muted/80 text-foreground focus:ring-primary/30'
            }`}
            aria-label="Reject refinement (Escape key)"
            title="Cancel and keep original text"
          >
            <X className="w-3 h-3" />
            Reject
          </button>
        </div>
      )}

      {/* Enhanced Keyboard Shortcuts Footer */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {operationState.isCompleting || operationState.showSuccess ? (
            <div className="flex items-center gap-2">
              {operationState.isCompleting ? (
                <span>{loadingMessage}</span>
              ) : (
                <span className="text-green-600 dark:text-green-400">
                  Refinement applied successfully!
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↵</kbd>
                accept
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">r</kbd>
                retry
              </span>
            </div>
          )}
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">esc</kbd>
            {operationState.isCompleting ? 'force close' : 'reject'}
          </span>
        </div>
      </div>

      {/* Screen Reader Summary */}
      <div className="sr-only" aria-live="polite">
        {operationState.showSuccess && "Refinement applied successfully."}
        {operationState.isCompleting && loadingMessage}
        {!isProcessing && !operationState.isCompleting && !operationState.showSuccess && (
          `Refinement preview ready. ${changeStats.additions} additions, ${changeStats.deletions} deletions. Press Enter to accept, R to retry, or Escape to reject.`
        )}
      </div>
    </div>
  );
} 