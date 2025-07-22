import { useState } from 'react';

export interface RefinementState {
  isProcessingRefinement: boolean;
  currentRefinementId: string | null;
  internalRefinedText: string | null;
  showInternalPreview: boolean;
  previewTransition: 'idle' | 'loading' | 'showing' | 'completing';
}

export interface RefinementHandlers {
  startRefinement: (refinementId: string) => void;
  setRefinementResult: (result: string | null) => void;
  showPreview: () => void;
  setCompleting: () => void;
  resetRefinement: () => void;
  setProcessing: (processing: boolean) => void;
}

export function useRefinementState() {
  const [refinementState, setRefinementState] = useState<RefinementState>({
    isProcessingRefinement: false,
    currentRefinementId: null,
    internalRefinedText: null,
    showInternalPreview: false,
    previewTransition: 'idle'
  });

  const handlers: RefinementHandlers = {
    startRefinement: (refinementId: string) => {
      setRefinementState({
        isProcessingRefinement: true,
        currentRefinementId: refinementId,
        internalRefinedText: null,
        showInternalPreview: false,
        previewTransition: 'loading'
      });
    },

    setRefinementResult: (result: string | null) => {
      setRefinementState(prev => ({
        ...prev,
        isProcessingRefinement: false,
        internalRefinedText: result,
        showInternalPreview: true,
        previewTransition: 'showing'
      }));
    },

    showPreview: () => {
      setRefinementState(prev => ({
        ...prev,
        isProcessingRefinement: false,
        showInternalPreview: true,
        previewTransition: 'showing'
      }));
    },

    setCompleting: () => {
      setRefinementState(prev => ({
        ...prev,
        previewTransition: 'completing'
      }));
    },

    resetRefinement: () => {
      setRefinementState({
        isProcessingRefinement: false,
        currentRefinementId: null,
        internalRefinedText: null,
        showInternalPreview: false,
        previewTransition: 'idle'
      });
    },

    setProcessing: (processing: boolean) => {
      setRefinementState(prev => ({
        ...prev,
        isProcessingRefinement: processing,
        internalRefinedText: null,
        showInternalPreview: false,
        previewTransition: processing ? 'loading' : 'idle'
      }));
    }
  };

  return {
    refinementState,
    ...handlers
  };
} 