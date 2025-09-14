import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

// ============================================================================
// CLIENT-SIDE OPERATIONAL TRANSFORM ENGINE
// ============================================================================

export interface TextOperation {
  type: "insert" | "delete" | "retain";
  position: number;
  content?: string;
  length?: number;
  attributes?: Record<string, any>;
}

export interface PendingOperation {
  id: string;
  operation: TextOperation;
  localSequence: number;
  basedOnSequence: number;
  timestamp: number;
  retryCount: number;
}

export interface OperationResult {
  operationId: string;
  sequenceNumber: number;
  transformedOperation?: TextOperation;
  needsTransform: boolean;
}

export interface DocumentState {
  content: string;
  sequenceNumber: number;
  lastModified: number;
  collaborators: string[];
}

/**
 * Client-side Operational Transform Engine
 * Manages local operations, server synchronization, and conflict resolution
 */
export class OTClient {
  private noteId: Id<"notes">;
  private userId: string;
  private clientId: string;
  
  // State management
  private localContent: string = "";
  private serverSequence: number = 0;
  private localSequence: number = 0;
  
  // Operation queues
  private pendingOperations: PendingOperation[] = [];
  private acknowledgedOperations: Set<string> = new Set();
  
  // Callbacks
  private onContentChange?: (content: string) => void;
  private onCollaboratorChange?: (collaborators: string[]) => void;
  private onError?: (error: Error) => void;
  
  // Convex mutations and queries
  private submitOperationMutation: any;
  private acknowledgeOperationMutation: any;
  
  // Sync state
  private isConnected: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  
  constructor(
    noteId: Id<"notes">,
    userId: string,
    options: {
      onContentChange?: (content: string) => void;
      onCollaboratorChange?: (collaborators: string[]) => void;
      onError?: (error: Error) => void;
    } = {}
  ) {
    this.noteId = noteId;
    this.userId = userId;
    this.clientId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.onContentChange = options.onContentChange;
    this.onCollaboratorChange = options.onCollaboratorChange;
    this.onError = options.onError;
    
    // Generate unique client ID for this session
    this.clientId = this.generateClientId();
  }
  
  /**
   * Initialize the OT client with Convex mutations
   */
  initialize(convexMutations: {
    submitOperation: any;
    acknowledgeOperation: any;
  }) {
    this.submitOperationMutation = convexMutations.submitOperation;
    this.acknowledgeOperationMutation = convexMutations.acknowledgeOperation;
  }
  
  /**
   * Connect to the collaborative session
   */
  async connect(initialState: DocumentState) {
    this.localContent = initialState.content;
    this.serverSequence = initialState.sequenceNumber;
    this.isConnected = true;
    
    // Start sync loop
    this.startSyncLoop();
    
    // Notify about initial collaborators
    if (this.onCollaboratorChange) {
      this.onCollaboratorChange(initialState.collaborators);
    }
  }
  
  /**
   * Disconnect from the collaborative session
   */
  disconnect() {
    this.isConnected = false;
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  /**
   * Apply a local text change and generate operations
   */
  applyLocalChange(newContent: string) {
    if (!this.isConnected) {
      this.localContent = newContent;
      return;
    }
    
    // Generate operations from the content change
    const operations = this.generateOperations(this.localContent, newContent);
    
    // Apply operations locally
    for (const operation of operations) {
      this.applyLocalOperation(operation);
    }
  }
  
  /**
   * Apply a local operation
   */
  private applyLocalOperation(operation: TextOperation) {
    // Create pending operation
    const pendingOp: PendingOperation = {
      id: this.generateOperationId(),
      operation,
      localSequence: ++this.localSequence,
      basedOnSequence: this.serverSequence,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    // Apply operation to local content
    this.localContent = this.applyOperation(this.localContent, operation);
    
    // Add to pending queue
    this.pendingOperations.push(pendingOp);
    
    // Notify about content change
    if (this.onContentChange) {
      this.onContentChange(this.localContent);
    }
    
    // Submit to server (async)
    this.submitPendingOperations();
  }
  
  /**
   * Apply a remote operation received from the server
   */
  applyRemoteOperation(remoteOp: {
    operationId: string;
    userId: string;
    sequenceNumber: number;
    operation: TextOperation;
    timestamp: number;
    isOwnOperation: boolean;
  }) {
    if (remoteOp.isOwnOperation) {
      // This is our own operation coming back from the server
      this.handleOwnOperationAck(remoteOp);
    } else {
      // This is someone else's operation
      this.handleRemoteOperation(remoteOp);
    }
  }
  
  /**
   * Handle acknowledgment of our own operation
   */
  private handleOwnOperationAck(remoteOp: any) {
    // Find the corresponding pending operation
    const pendingIndex = this.pendingOperations.findIndex(
      pending => pending.basedOnSequence < remoteOp.sequenceNumber
    );
    
    if (pendingIndex >= 0) {
      const pending = this.pendingOperations[pendingIndex];
      this.pendingOperations.splice(pendingIndex, 1);
      this.acknowledgedOperations.add(remoteOp.operationId);
    }
    
    this.serverSequence = Math.max(this.serverSequence, remoteOp.sequenceNumber);
    
    // Acknowledge the operation
    this.acknowledgeOperationMutation({
      operationId: remoteOp.operationId,
      noteId: this.noteId,
      userId: this.userId,
      clientId: this.clientId,
    }).catch((error: Error) => {
      if (this.onError) this.onError(error);
    });
  }
  
  /**
   * Handle a remote operation from another user
   */
  private handleRemoteOperation(remoteOp: any) {
    // Transform the remote operation against pending operations
    let transformedOp = remoteOp.operation;
    
    for (const pending of this.pendingOperations) {
      transformedOp = this.transformOperation(transformedOp, pending.operation, "left");
    }
    
    // Apply the transformed operation to local content
    this.localContent = this.applyOperation(this.localContent, transformedOp);
    this.serverSequence = Math.max(this.serverSequence, remoteOp.sequenceNumber);
    
    // Transform pending operations against the remote operation
    this.transformPendingOperations(remoteOp.operation);
    
    // Notify about content change
    if (this.onContentChange) {
      this.onContentChange(this.localContent);
    }
    
    // Acknowledge the operation
    this.acknowledgeOperationMutation({
      operationId: remoteOp.operationId,
      noteId: this.noteId,
      userId: this.userId,
      clientId: this.clientId,
    }).catch((error: Error) => {
      if (this.onError) this.onError(error);
    });
  }
  
  /**
   * Transform pending operations against a remote operation
   */
  private transformPendingOperations(remoteOp: TextOperation) {
    for (const pending of this.pendingOperations) {
      pending.operation = this.transformOperation(pending.operation, remoteOp, "right");
    }
  }
  
  /**
   * Submit pending operations to the server
   */
  private async submitPendingOperations() {
    if (this.pendingOperations.length === 0 || !this.isConnected) {
      return;
    }
    
    // Submit operations in order
    for (const pending of [...this.pendingOperations]) {
      try {
        const result = await this.submitOperationMutation({
          noteId: this.noteId,
          userId: this.userId,
          operation: pending.operation,
          clientId: this.clientId,
          localSequence: pending.localSequence,
          basedOnSequence: pending.basedOnSequence,
        });
        
        // Handle server response
        if (result.needsTransform && result.transformedOperation) {
          // Server transformed our operation, update local state
          pending.operation = result.transformedOperation;
        }
        
      } catch (error) {
        pending.retryCount++;
        if (pending.retryCount >= 3) {
          // Remove failed operation after 3 retries
          const index = this.pendingOperations.indexOf(pending);
          if (index >= 0) {
            this.pendingOperations.splice(index, 1);
          }
          if (this.onError) {
            this.onError(new Error(`Failed to submit operation after 3 retries: ${error}`));
          }
        }
      }
    }
  }
  
  /**
   * Start the sync loop for receiving remote operations
   */
  private startSyncLoop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Poll for new operations every 500ms
    this.syncInterval = setInterval(() => {
      if (this.isConnected) {
        this.syncWithServer();
      }
    }, 500);
  }
  
  /**
   * Sync with server to get new operations
   */
  private async syncWithServer() {
    // This would be implemented using Convex subscriptions in practice
    // For now, we'll use polling as a fallback
  }
  
  /**
   * Generate operations from text changes
   */
  private generateOperations(oldText: string, newText: string): TextOperation[] {
    const operations: TextOperation[] = [];
    
    // Simple diff algorithm
    let i = 0;
    let j = 0;
    
    while (i < oldText.length || j < newText.length) {
      if (i < oldText.length && j < newText.length && oldText[i] === newText[j]) {
        i++;
        j++;
      } else if (j < newText.length && (i >= oldText.length || oldText[i] !== newText[j])) {
        // Insert
        operations.push({
          type: "insert",
          position: i,
          content: newText[j]
        });
        j++;
      } else if (i < oldText.length) {
        // Delete
        operations.push({
          type: "delete",
          position: i,
          length: 1
        });
        i++;
      }
    }
    
    return this.mergeOperations(operations);
  }
  
  /**
   * Apply an operation to text content
   */
  private applyOperation(content: string, operation: TextOperation): string {
    switch (operation.type) {
      case "insert":
        const insertPos = Math.min(operation.position, content.length);
        return content.slice(0, insertPos) + (operation.content || "") + content.slice(insertPos);
      
      case "delete":
        const deleteStart = Math.min(operation.position, content.length);
        const deleteEnd = Math.min(deleteStart + (operation.length || 0), content.length);
        return content.slice(0, deleteStart) + content.slice(deleteEnd);
      
      case "retain":
        return content;
      
      default:
        return content;
    }
  }
  
  /**
   * Transform operation A against operation B
   */
  private transformOperation(
    opA: TextOperation, 
    opB: TextOperation, 
    priority: "left" | "right" = "left"
  ): TextOperation {
    // Insert vs Insert
    if (opA.type === "insert" && opB.type === "insert") {
      if (opA.position < opB.position || (opA.position === opB.position && priority === "left")) {
        return opA;
      } else {
        return {
          ...opA,
          position: opA.position + (opB.content?.length || 0)
        };
      }
    }
    
    // Insert vs Delete
    if (opA.type === "insert" && opB.type === "delete") {
      if (opA.position <= opB.position) {
        return opA;
      } else {
        return {
          ...opA,
          position: Math.max(opB.position, opA.position - (opB.length || 0))
        };
      }
    }
    
    // Delete vs Insert
    if (opA.type === "delete" && opB.type === "insert") {
      if (opA.position < opB.position) {
        return opA;
      } else {
        return {
          ...opA,
          position: opA.position + (opB.content?.length || 0)
        };
      }
    }
    
    // Delete vs Delete
    if (opA.type === "delete" && opB.type === "delete") {
      const aEnd = opA.position + (opA.length || 0);
      const bEnd = opB.position + (opB.length || 0);
      
      if (aEnd <= opB.position) {
        return opA;
      } else if (opA.position >= bEnd) {
        return {
          ...opA,
          position: opA.position - (opB.length || 0)
        };
      } else {
        // Overlapping deletes
        const overlapStart = Math.max(opA.position, opB.position);
        const overlapEnd = Math.min(aEnd, bEnd);
        const overlapLength = overlapEnd - overlapStart;
        
        if (opA.position < opB.position) {
          return {
            ...opA,
            length: (opA.length || 0) - overlapLength
          };
        } else {
          return {
            ...opA,
            position: opB.position,
            length: Math.max(0, (opA.length || 0) - overlapLength)
          };
        }
      }
    }
    
    return opA;
  }
  
  /**
   * Merge consecutive operations for efficiency
   */
  private mergeOperations(operations: TextOperation[]): TextOperation[] {
    if (operations.length === 0) return [];
    
    const merged: TextOperation[] = [];
    let current = { ...operations[0] };
    
    for (let i = 1; i < operations.length; i++) {
      const next = operations[i];
      
      if (current.type === next.type) {
        if (current.type === "insert" && 
            current.position + (current.content?.length || 0) === next.position) {
          current.content = (current.content || "") + (next.content || "");
          continue;
        } else if (current.type === "delete" && current.position === next.position) {
          current.length = (current.length || 0) + (next.length || 0);
          continue;
        }
      }
      
      merged.push(current);
      current = { ...next };
    }
    
    merged.push(current);
    return merged;
  }
  
  /**
   * Generate a unique operation ID
   */
  private generateOperationId(): string {
    return `${this.userId}_${this.clientId}_${this.localSequence}_${Date.now()}`;
  }
  
  /**
   * Generate a unique client ID
   */
  private generateClientId(): string {
    return `${this.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get current local content
   */
  getContent(): string {
    return this.localContent;
  }
  
  /**
   * Get pending operations count
   */
  getPendingOperationsCount(): number {
    return this.pendingOperations.length;
  }
  
  /**
   * Check if client is connected
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }
}
