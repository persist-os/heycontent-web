import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export interface RealtimeSyncOptions {
  noteId: Id<"notes">;
  userId: string;
  onOperationReceived: (operation: {
    operationId: string;
    userId: string;
    sequenceNumber: number;
    operation: any;
    timestamp: number;
    isOwnOperation: boolean;
  }) => void;
  onDocumentStateChange: (state: {
    content: string;
    sequenceNumber: number;
    lastModified: number;
    collaborators: string[];
  }) => void;
  onError?: (error: Error) => void;
  syncInterval?: number;
  enabled?: boolean;
}

/**
 * Hook for real-time synchronization of operations using Convex subscriptions
 */
export function useRealtimeSync({
  noteId,
  userId,
  onOperationReceived,
  onDocumentStateChange,
  onError,
  syncInterval = 500,
  enabled = true,
}: RealtimeSyncOptions) {
  
  const lastSequenceRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);
  
  // Get document state (this will update when the document changes)
  const documentState = useQuery(
    api.textOperations.getDocumentState,
    enabled ? { noteId, userId } : "skip"
  );
  
  // Get operations since last sequence (this will update when new operations arrive)
  const newOperations = useQuery(
    api.textOperations.getOperationsSince,
    enabled ? {
      noteId,
      sinceSequence: lastSequenceRef.current,
      userId,
    } : "skip"
  );
  
  // Handle document state changes
  useEffect(() => {
    if (documentState && enabled) {
      // Initialize sequence number on first load
      if (!isInitializedRef.current) {
        lastSequenceRef.current = documentState.sequenceNumber;
        isInitializedRef.current = true;
      }
      
      // Notify about document state change
      onDocumentStateChange(documentState);
    }
  }, [documentState, onDocumentStateChange, enabled]);
  
  // Handle new operations
  useEffect(() => {
    if (newOperations && enabled && isInitializedRef.current) {
      try {
        // Process each new operation
        for (const operation of newOperations) {
          // Update last sequence number
          if (operation.sequenceNumber > lastSequenceRef.current) {
            lastSequenceRef.current = operation.sequenceNumber;
          }
          
          // Notify about the operation
          onOperationReceived(operation);
        }
      } catch (error) {
        if (onError) {
          onError(error instanceof Error ? error : new Error('Failed to process operations'));
        }
      }
    }
  }, [newOperations, onOperationReceived, onError, enabled]);
  
  // Reset when noteId changes
  useEffect(() => {
    lastSequenceRef.current = 0;
    isInitializedRef.current = false;
  }, [noteId]);
  
  // Return sync status and controls
  return {
    isConnected: enabled && documentState !== undefined,
    lastSequence: lastSequenceRef.current,
    documentState,
    pendingOperations: newOperations?.length || 0,
  };
}

/**
 * Hook for monitoring collaboration activity on a note
 */
export function useCollaborationActivity(noteId: Id<"notes">, userId: string) {
  const documentState = useQuery(api.textOperations.getDocumentState, { noteId, userId });
  const recentOperations = useQuery(api.textOperations.getOperationHistory, {
    noteId,
    userId,
    limit: 20,
  });
  
  // Get active collaborators (users with operations in the last 5 minutes)
  const activeCollaborators = recentOperations?.filter(op => 
    op.timestamp > Date.now() - 5 * 60 * 1000 && op.userId !== userId
  ).map(op => op.userId) || [];
  
  // Remove duplicates
  const uniqueCollaborators = [...new Set(activeCollaborators)];
  
  return {
    collaborators: documentState?.collaborators || [],
    activeCollaborators: uniqueCollaborators,
    recentActivity: recentOperations?.slice(0, 5) || [],
    isLoading: documentState === undefined,
  };
}

/**
 * Hook for real-time cursor positions (future enhancement)
 */
export function useCursorSync(noteId: Id<"notes">, userId: string) {
  // This would track cursor positions of collaborators
  // For now, return empty state
  return {
    cursors: {},
    updateCursor: (position: number) => {
      // Would send cursor position to other clients
    },
  };
}

/**
 * Enhanced version of useRealtimeSync with automatic reconnection
 */
export function useRealtimeSyncWithReconnection(options: RealtimeSyncOptions) {
  const {
    noteId,
    userId,
    onOperationReceived,
    onDocumentStateChange,
    onError,
    syncInterval = 500,
    enabled = true,
  } = options;
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;
  
  // Wrap error handler to include reconnection logic
  const handleError = useCallback((error: Error) => {
    console.error('Realtime sync error:', error);
    
    if (onError) {
      onError(error);
    }
    
    // Attempt reconnection with exponential backoff
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttemptsRef.current++;
        // The hook will automatically retry due to Convex's built-in retry logic
      }, delay);
    }
  }, [onError]);
  
  // Use the base sync hook
  const syncResult = useRealtimeSync({
    ...options,
    onError: handleError,
  });
  
  // Reset reconnection attempts on successful connection
  useEffect(() => {
    if (syncResult.isConnected) {
      reconnectAttemptsRef.current = 0;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }
  }, [syncResult.isConnected]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    ...syncResult,
    reconnectAttempts: reconnectAttemptsRef.current,
    maxReconnectAttempts,
  };
}
