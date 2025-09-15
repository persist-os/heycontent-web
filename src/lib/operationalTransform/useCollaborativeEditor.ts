import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { OTClient, DocumentState } from "./client";
import { useRealtimeSyncWithReconnection } from "./useRealtimeSync";

export interface CollaborativeEditorState {
  content: string;
  isConnected: boolean;
  collaborators: string[];
  pendingOperations: number;
  lastSaved: Date | null;
  error: string | null;
}

export interface CollaborativeEditorActions {
  updateContent: (content: string) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  forceSync: () => Promise<void>;
}

/**
 * React hook for collaborative text editing with operational transform
 */
export function useCollaborativeEditor(
  noteId: Id<"notes">,
  userId: string,
  options: {
    autoConnect?: boolean;
    syncInterval?: number;
    onError?: (error: Error) => void;
  } = {}
): [CollaborativeEditorState, CollaborativeEditorActions] {
  
  const { autoConnect = true, syncInterval = 500, onError } = options;
  
  // State
  const [state, setState] = useState<CollaborativeEditorState>({
    content: "",
    isConnected: false,
    collaborators: [],
    pendingOperations: 0,
    lastSaved: null,
    error: null,
  });
  
  // Refs
  const otClientRef = useRef<OTClient | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncSequenceRef = useRef<number>(0);
  
  // Convex mutations
  const submitOperation = useMutation(api.textOperations.submitOperation);
  const acknowledgeOperation = useMutation(api.textOperations.acknowledgeOperation);
  
  // Real-time synchronization
  const realtimeSync = useRealtimeSyncWithReconnection({
    noteId,
    userId,
    enabled: state.isConnected,
    onOperationReceived: (operation) => {
      if (otClientRef.current) {
        otClientRef.current.applyRemoteOperation(operation);
      }
    },
    onDocumentStateChange: (docState) => {
      setState(prev => ({
        ...prev,
        collaborators: docState.collaborators,
      }));
    },
    onError: (error) => {
      setState(prev => ({ ...prev, error: error.message }));
      if (onError) onError(error);
    },
  });
  
  // Initialize OT client
  useEffect(() => {
    if (!otClientRef.current) {
      otClientRef.current = new OTClient(noteId, userId, {
        onContentChange: (content: string) => {
          setState(prev => ({ 
            ...prev, 
            content,
            lastSaved: new Date(),
          }));
        },
        onCollaboratorChange: (collaborators: string[]) => {
          setState(prev => ({ ...prev, collaborators }));
        },
        onError: (error: Error) => {
          setState(prev => ({ ...prev, error: error.message }));
          if (onError) onError(error);
        },
      });
      
      // Initialize with Convex mutations
      otClientRef.current.initialize({
        submitOperation,
        acknowledgeOperation,
      });
    }
    
    return () => {
      if (otClientRef.current) {
        otClientRef.current.disconnect();
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [noteId, userId, submitOperation, acknowledgeOperation, onError]);
  
  // Auto-connect when document state is available
  useEffect(() => {
    if (autoConnect && realtimeSync.documentState && otClientRef.current && !state.isConnected) {
      connect();
    }
  }, [realtimeSync.documentState, autoConnect, state.isConnected]);
  
  // Update connection status based on realtime sync
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isConnected: realtimeSync.isConnected,
    }));
  }, [realtimeSync.isConnected]);
  
  // Update pending operations count
  useEffect(() => {
    if (otClientRef.current) {
      const updatePendingCount = () => {
        setState(prev => ({
          ...prev,
          pendingOperations: otClientRef.current?.getPendingOperationsCount() || 0,
        }));
      };
      
      const interval = setInterval(updatePendingCount, 100);
      return () => clearInterval(interval);
    }
  }, [state.isConnected]);
  
  // Actions
  const connect = useCallback(async () => {
    if (!realtimeSync.documentState || !otClientRef.current) {
      throw new Error("Document state not available or OT client not initialized");
    }
    
    try {
      await otClientRef.current.connect(realtimeSync.documentState);
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        content: realtimeSync.documentState.content,
        collaborators: realtimeSync.documentState.collaborators,
        error: null,
      }));
      
      // Start sync loop
      startSyncLoop();
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to connect",
      }));
      throw error;
    }
  }, [realtimeSync.documentState]);
  
  const disconnect = useCallback(() => {
    if (otClientRef.current) {
      otClientRef.current.disconnect();
    }
    
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      collaborators: [],
      pendingOperations: 0,
    }));
  }, []);
  
  const updateContent = useCallback((content: string) => {
    if (otClientRef.current && state.isConnected) {
      otClientRef.current.applyLocalChange(content);
    } else {
      // If not connected, just update local state
      setState(prev => ({ ...prev, content }));
    }
  }, [state.isConnected]);
  
  const forceSync = useCallback(async () => {
    // Force a sync by reconnecting the realtime sync
    if (otClientRef.current && state.isConnected) {
      disconnect();
      await connect();
    }
  }, [state.isConnected, connect, disconnect]);
  
  // Start sync loop for real-time updates
  const startSyncLoop = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    
    syncIntervalRef.current = setInterval(() => {
      // The sync happens automatically through Convex subscriptions
      // This interval is just for updating UI state
      if (otClientRef.current) {
        setState(prev => ({
          ...prev,
          pendingOperations: otClientRef.current?.getPendingOperationsCount() || 0,
          isConnected: otClientRef.current?.isClientConnected() || false,
        }));
      }
    }, syncInterval);
  }, [syncInterval]);
  
  return [
    state,
    {
      updateContent,
      connect,
      disconnect,
      forceSync,
    },
  ];
}

/**
 * Hook for getting collaborative editor status
 */
export function useCollaborativeEditorStatus(noteId: Id<"notes">, userId: string) {
  const documentState = useQuery(api.textOperations.getDocumentState, { noteId, userId });
  const operationHistory = useQuery(api.textOperations.getOperationHistory, { 
    noteId, 
    userId, 
    limit: 10 
  });
  
  return {
    documentState,
    recentOperations: operationHistory,
    isLoading: documentState === undefined,
  };
}
