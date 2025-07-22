import { useState } from 'react';

export interface OperationState {
  isOperationInProgress: boolean;
  loadingCommandId: string | null;
  completedCommandId: string | null;
  operationType: 'generation' | 'refinement' | 'formatting' | null;
}

export interface OperationHandlers {
  startOperation: (commandId: string, type: 'generation' | 'refinement' | 'formatting') => void;
  completeOperation: (commandId: string) => void;
  resetOperation: () => void;
  setOperationState: (state: Partial<OperationState>) => void;
}

export function useOperationState() {
  const [operationState, setOperationStateInternal] = useState<OperationState>({
    isOperationInProgress: false,
    loadingCommandId: null,
    completedCommandId: null,
    operationType: null
  });

  const handlers: OperationHandlers = {
    startOperation: (commandId: string, type: 'generation' | 'refinement' | 'formatting') => {
      setOperationStateInternal({
        isOperationInProgress: true,
        loadingCommandId: commandId,
        completedCommandId: null,
        operationType: type
      });
    },

    completeOperation: (commandId: string) => {
      setOperationStateInternal(prev => ({
        ...prev,
        isOperationInProgress: false,
        loadingCommandId: null,
        completedCommandId: commandId
      }));
    },

    resetOperation: () => {
      setOperationStateInternal({
        isOperationInProgress: false,
        loadingCommandId: null,
        completedCommandId: null,
        operationType: null
      });
    },

    setOperationState: (newState: Partial<OperationState>) => {
      setOperationStateInternal(prev => ({
        ...prev,
        ...newState
      }));
    }
  };

  return {
    operationState,
    ...handlers
  };
} 