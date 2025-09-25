import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// ============================================================================
// OPERATIONAL TRANSFORM TYPES
// ============================================================================

export interface TextOperation {
  type: "insert" | "delete" | "retain";
  position: number;
  content?: string; // For insert operations
  length?: number; // For delete/retain operations
  attributes?: Record<string, any>; // For formatting
}

export interface OperationRecord {
  operationId: string;
  noteId: Id<"notes">;
  userId: string;
  sequenceNumber: number;
  vectorClock: Record<string, number>;
  operation: TextOperation;
  transformedFrom?: string[];
  isCommitted: boolean;
  timestamp: number;
  createdAt: number;
}

export interface DocumentState {
  content: string;
  sequenceNumber: number;
  vectorClock: Record<string, number>;
}

// ============================================================================
// OPERATIONAL TRANSFORM CORE FUNCTIONS
// ============================================================================

/**
 * Transform operation A against operation B
 * Returns the transformed version of A that can be applied after B
 */
export function transformOperation(
  opA: TextOperation, 
  opB: TextOperation, 
  priority: "left" | "right" = "left"
): TextOperation {
  // Insert vs Insert
  if (opA.type === "insert" && opB.type === "insert") {
    if (opA.position < opB.position || (opA.position === opB.position && priority === "left")) {
      return opA; // A comes before B, no change needed
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
      return opA; // Insert before delete position, no change
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
      return opA; // Delete before insert, no change
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
      return opA; // A is completely before B
    } else if (opA.position >= bEnd) {
      return {
        ...opA,
        position: opA.position - (opB.length || 0)
      };
    } else {
      // Overlapping deletes - need to adjust
      const overlapStart = Math.max(opA.position, opB.position);
      const overlapEnd = Math.min(aEnd, bEnd);
      const overlapLength = overlapEnd - overlapStart;

      if (opA.position < opB.position) {
        // A starts before B
        return {
          ...opA,
          length: (opA.length || 0) - overlapLength
        };
      } else {
        // A starts after or at B's position
        return {
          ...opA,
          position: opB.position,
          length: Math.max(0, (opA.length || 0) - overlapLength)
        };
      }
    }
  }

  // Retain operations (for now, just pass through)
  if (opA.type === "retain" || opB.type === "retain") {
    return opA;
  }

  return opA;
}

/**
 * Transform an operation against a list of operations
 */
export function transformAgainstOperations(
  operation: TextOperation,
  againstOps: TextOperation[],
  priority: "left" | "right" = "left"
): TextOperation {
  return againstOps.reduce((op, againstOp) => 
    transformOperation(op, againstOp, priority), operation
  );
}

/**
 * Apply an operation to document content
 */
export function applyOperation(content: string, operation: TextOperation): string {
  switch (operation.type) {
    case "insert":
      const insertPos = Math.min(operation.position, content.length);
      return content.slice(0, insertPos) + (operation.content || "") + content.slice(insertPos);
    
    case "delete":
      const deleteStart = Math.min(operation.position, content.length);
      const deleteEnd = Math.min(deleteStart + (operation.length || 0), content.length);
      return content.slice(0, deleteStart) + content.slice(deleteEnd);
    
    case "retain":
      return content; // Retain doesn't change content, just position
    
    default:
      return content;
  }
}

/**
 * Generate operations to transform one text into another
 */
export function generateOperations(oldText: string, newText: string): TextOperation[] {
  const operations: TextOperation[] = [];
  
  // Simple diff algorithm - can be enhanced with more sophisticated algorithms
  let i = 0;
  let j = 0;
  
  while (i < oldText.length || j < newText.length) {
    if (i < oldText.length && j < newText.length && oldText[i] === newText[j]) {
      // Characters match, move forward
      i++;
      j++;
    } else if (j < newText.length && (i >= oldText.length || oldText[i] !== newText[j])) {
      // Insert character from new text
      operations.push({
        type: "insert",
        position: i,
        content: newText[j]
      });
      j++;
    } else if (i < oldText.length) {
      // Delete character from old text
      operations.push({
        type: "delete",
        position: i,
        length: 1
      });
      i++;
    }
  }
  
  return operations;
}

/**
 * Merge consecutive operations of the same type for efficiency
 */
export function mergeOperations(operations: TextOperation[]): TextOperation[] {
  if (operations.length === 0) return [];
  
  const merged: TextOperation[] = [];
  let current = { ...operations[0] };
  
  for (let i = 1; i < operations.length; i++) {
    const next = operations[i];
    
    // Try to merge with current operation
    if (current.type === next.type) {
      if (current.type === "insert" && 
          current.position + (current.content?.length || 0) === next.position) {
        // Merge consecutive inserts
        current.content = (current.content || "") + (next.content || "");
        continue;
      } else if (current.type === "delete" && 
                 current.position === next.position) {
        // Merge consecutive deletes at same position
        current.length = (current.length || 0) + (next.length || 0);
        continue;
      }
    }
    
    // Can't merge, push current and start new
    merged.push(current);
    current = { ...next };
  }
  
  merged.push(current);
  return merged;
}

/**
 * Create a vector clock for a user
 */
export function createVectorClock(userId: string, sequenceNumber: number): Record<string, number> {
  return { [userId]: sequenceNumber };
}

/**
 * Merge two vector clocks
 */
export function mergeVectorClocks(
  clock1: Record<string, number>, 
  clock2: Record<string, number>
): Record<string, number> {
  const merged = { ...clock1 };
  
  for (const [userId, seq] of Object.entries(clock2)) {
    merged[userId] = Math.max(merged[userId] || 0, seq);
  }
  
  return merged;
}

/**
 * Compare vector clocks to determine ordering
 */
export function compareVectorClocks(
  clock1: Record<string, number>, 
  clock2: Record<string, number>
): "before" | "after" | "concurrent" {
  let clock1Greater = false;
  let clock2Greater = false;
  
  const allUsers = new Set([...Object.keys(clock1), ...Object.keys(clock2)]);
  
  for (const userId of allUsers) {
    const seq1 = clock1[userId] || 0;
    const seq2 = clock2[userId] || 0;
    
    if (seq1 > seq2) clock1Greater = true;
    if (seq2 > seq1) clock2Greater = true;
  }
  
  if (clock1Greater && !clock2Greater) return "after";
  if (clock2Greater && !clock1Greater) return "before";
  return "concurrent";
}

// ============================================================================
// CONVEX VALIDATORS
// ============================================================================

export const textOperationValidator = v.object({
  type: v.union(v.literal("insert"), v.literal("delete"), v.literal("retain")),
  position: v.number(),
  content: v.optional(v.string()),
  length: v.optional(v.number()),
  attributes: v.optional(v.record(v.string(), v.any())),
});

export const operationRecordValidator = v.object({
  operationId: v.string(),
  noteId: v.id("notes"),
  userId: v.string(),
  sequenceNumber: v.number(),
  vectorClock: v.record(v.string(), v.number()),
  operation: textOperationValidator,
  transformedFrom: v.optional(v.array(v.string())),
  isCommitted: v.boolean(),
  timestamp: v.number(),
  createdAt: v.number(),
});
