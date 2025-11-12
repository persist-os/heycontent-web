import { useState, useEffect } from 'react';
import { useOperationState } from '@/app/dashboard/notes/hooks/useOperationState';
import { useRefinementState } from '@/app/dashboard/notes/hooks/useRefinementState';

export interface EmailCommandPaletteHookProps {
  isOpen: boolean;
  emailContext: 'compose' | 'reply';
  selectedText: string;
  onClose: () => void;
  onCustomInput: (prompt: string) => Promise<void>;
  onRefineText: (refinementPrompt: string, text: string) => Promise<string>;
  onAcceptRefinement: () => Promise<void>;
  onRejectRefinement: () => Promise<void>;
  onRetryRefinement: () => Promise<string>;
}

export function useEmailCommandPalette(props: EmailCommandPaletteHookProps) {
  const {
    isOpen,
    emailContext,
    selectedText,
    onClose,
    onCustomInput,
    onRefineText,
    onAcceptRefinement,
    onRejectRefinement,
    onRetryRefinement
  } = props;

  // State management
  const [selectedIndex, setSelectedIndex] = useState(0);
  const refinementMode = !!selectedText;

  // State hooks
  const operationHook = useOperationState();
  const refinementHook = useRefinementState();

  // Auto-close after successful completion
  useEffect(() => {
    if (operationHook.operationState.completedCommandId) {
      const timer = setTimeout(() => {
        operationHook.resetOperation();
        onClose();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [operationHook.operationState.completedCommandId, onClose]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      operationHook.resetOperation();
      refinementHook.resetRefinement();
    }
  }, [isOpen, emailContext]);

  // Handle custom generation
  const handleCustomGeneration = async (input: string) => {
    if (!input.trim()) return;
    
    operationHook.startOperation('custom-generation', 'generation');
    
    try {
      await onCustomInput(input);
      operationHook.completeOperation('custom-generation');
      
      setTimeout(() => {
        operationHook.resetOperation();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to execute custom generation:', error);
      operationHook.resetOperation();
    }
  };

  // Handle refinement select
  const handleRefinementSelect = async (refinementId: string) => {
    if (!selectedText || refinementHook.refinementState.isProcessingRefinement) return;
    
    refinementHook.startRefinement(refinementId);
    operationHook.startOperation(refinementId, 'refinement');

    try {
      // Handle custom refinement
      if (refinementId.startsWith('custom:')) {
        const customPrompt = refinementId.replace('custom:', '');
        const result = await onRefineText(customPrompt, selectedText);
        
        if (typeof result === 'string') {
          refinementHook.setRefinementResult(result);
        } else {
          setTimeout(() => {
            refinementHook.showPreview();
          }, 500);
        }
      } else {
        // Handle preset refinement
        const result = await onRefineText(refinementId, selectedText);
        
        if (typeof result === 'string') {
          refinementHook.setRefinementResult(result);
        } else {
          setTimeout(() => {
            refinementHook.showPreview();
          }, 500);
        }
      }

      operationHook.resetOperation();
    } catch (error) {
      console.error('Failed to refine text:', error);
      refinementHook.resetRefinement();
      operationHook.resetOperation();
    }
  };

  // Handle internal preview accept
  const handleInternalPreviewAccept = async () => {
    refinementHook.setCompleting();
    try {
      await onAcceptRefinement();
      refinementHook.resetRefinement();
      operationHook.resetOperation();
      onClose();
    } catch (error) {
      console.error('Failed to accept refinement:', error);
      refinementHook.resetRefinement();
    }
  };

  // Handle internal preview retry
  const handleInternalPreviewRetry = async () => {
    if (!selectedText) return;
    
    refinementHook.setProcessing(true);
    try {
      const result = await onRetryRefinement();
      if (typeof result === 'string') {
        refinementHook.setRefinementResult(result);
      }
    } catch (error) {
      console.error('Failed to retry refinement:', error);
      refinementHook.resetRefinement();
    } finally {
      refinementHook.setProcessing(false);
    }
  };

  // Handle internal preview reject
  const handleInternalPreviewReject = async () => {
    try {
      await onRejectRefinement();
      refinementHook.resetRefinement();
    } catch (error) {
      console.error('Failed to reject refinement:', error);
    }
  };

  return {
    // State
    selectedIndex,
    setSelectedIndex,
    refinementMode,
    
    // Operation state
    operationState: operationHook.operationState,
    refinementState: refinementHook.refinementState,
    
    // Command handlers
    handleCustomGeneration,
    handleRefinementSelect,
    handleInternalPreviewAccept,
    handleInternalPreviewRetry,
    handleInternalPreviewReject
  };
}

