import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { 
  TextOperation, 
  OperationRecord, 
  DocumentState,
  transformOperation,
  transformAgainstOperations,
  applyOperation,
  mergeOperations,
  createVectorClock,
  mergeVectorClocks,
  compareVectorClocks,
  textOperationValidator 
} from "./operationalTransform";

// ============================================================================
// OPERATION SUBMISSION
// ============================================================================

/**
 * Submit a text operation for a note
 * This is the main entry point for real-time text collaboration
 */
export const submitOperation = mutation({
  args: {
    noteId: v.id("notes"),
    userId: v.string(),
    operation: textOperationValidator,
    clientId: v.string(),
    localSequence: v.number(), // Client's local sequence number
    basedOnSequence: v.number(), // Server sequence this operation is based on
  },
  returns: v.object({
    operationId: v.string(),
    sequenceNumber: v.number(),
    transformedOperation: v.optional(textOperationValidator),
    needsTransform: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { noteId, userId, operation, clientId, localSequence, basedOnSequence } = args;

    // Verify user has access to the note
    const note = await ctx.db.get(noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    // Check if user owns the note or has edit permission
    const hasAccess = note.userId === userId || 
      await ctx.runQuery(internal.textOperations.checkNoteEditAccess, { noteId, userId });
    
    if (!hasAccess) {
      throw new Error("No edit access to this note");
    }

    // Generate unique operation ID
    const operationId = `${userId}_${clientId}_${localSequence}_${Date.now()}`;
    const timestamp = Date.now();

    // Get current sequence number for this note
    const currentSequence = await ctx.runQuery(internal.textOperations.getCurrentSequenceNumber, { noteId });
    const newSequenceNumber = currentSequence + 1;

    // Get operations that happened after the base sequence
    const conflictingOps = await ctx.runQuery(internal.textOperations.getOperationsSinceSequence, {
      noteId,
      sinceSequence: basedOnSequence
    });

    // Transform the operation against conflicting operations
    let transformedOp = operation;
    const transformedFrom: string[] = [];
    
    if (conflictingOps.length > 0) {
      const conflictingOperations = conflictingOps.map(op => op.operation);
      transformedOp = transformAgainstOperations(operation, conflictingOperations, "right");
      transformedFrom.push(...conflictingOps.map(op => op.operationId));
    }

    // Create vector clock
    const vectorClock = createVectorClock(userId, newSequenceNumber);

    // Store the operation
    await ctx.db.insert("text_operations", {
      operationId,
      noteId,
      userId,
      sequenceNumber: newSequenceNumber,
      vectorClock,
      operation: transformedOp,
      transformedFrom: transformedFrom.length > 0 ? transformedFrom : undefined,
      isCommitted: true,
      timestamp,
      createdAt: timestamp,
    });

    // Apply the operation to the note content
    await ctx.runMutation(internal.textOperations.applyOperationToNote, {
      noteId,
      operation: transformedOp,
      sequenceNumber: newSequenceNumber,
    });

    // Schedule snapshot creation if needed
    await ctx.runMutation(internal.textOperations.scheduleSnapshotIfNeeded, { noteId });

    return {
      operationId,
      sequenceNumber: newSequenceNumber,
      transformedOperation: conflictingOps.length > 0 ? transformedOp : undefined,
      needsTransform: conflictingOps.length > 0,
    };
  },
});

/**
 * Acknowledge that an operation has been received and processed by a client
 */
export const acknowledgeOperation = mutation({
  args: {
    operationId: v.string(),
    noteId: v.id("notes"),
    userId: v.string(),
    clientId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { operationId, noteId, userId, clientId } = args;

    // Check if acknowledgment already exists
    const existing = await ctx.db
      .query("operation_acknowledgments")
      .withIndex("by_operation", (q) => q.eq("operationId", operationId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .filter((q) => q.eq(q.field("clientId"), clientId))
      .unique();

    if (!existing) {
      await ctx.db.insert("operation_acknowledgments", {
        operationId,
        noteId,
        userId,
        clientId,
        acknowledgedAt: Date.now(),
      });
    }

    return null;
  },
});

// ============================================================================
// OPERATION QUERIES
// ============================================================================

/**
 * Get operations for a note since a specific sequence number
 * Used for real-time synchronization
 */
export const getOperationsSince = query({
  args: {
    noteId: v.id("notes"),
    sinceSequence: v.number(),
    userId: v.string(),
  },
  returns: v.array(v.object({
    operationId: v.string(),
    userId: v.string(),
    sequenceNumber: v.number(),
    operation: textOperationValidator,
    timestamp: v.number(),
    isOwnOperation: v.boolean(),
  })),
  handler: async (ctx, args) => {
    const { noteId, sinceSequence, userId } = args;

    // Verify user has access to the note
    const hasAccess = await ctx.runQuery(internal.textOperations.checkNoteAccess, { noteId, userId });
    if (!hasAccess) {
      throw new Error("No access to this note");
    }

    const operations = await ctx.db
      .query("text_operations")
      .withIndex("by_note_sequence", (q) => 
        q.eq("noteId", noteId).gt("sequenceNumber", sinceSequence)
      )
      .filter((q) => q.eq(q.field("isCommitted"), true))
      .order("asc")
      .collect();

    return operations.map(op => ({
      operationId: op.operationId,
      userId: op.userId,
      sequenceNumber: op.sequenceNumber,
      operation: op.operation,
      timestamp: op.timestamp,
      isOwnOperation: op.userId === userId,
    }));
  },
});

/**
 * Get the current document state for a note
 */
export const getDocumentState = query({
  args: {
    noteId: v.id("notes"),
    userId: v.string(),
  },
  returns: v.object({
    content: v.string(),
    sequenceNumber: v.number(),
    lastModified: v.number(),
    collaborators: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const { noteId, userId } = args;

    // Verify user has access to the note
    const hasAccess = await ctx.runQuery(internal.textOperations.checkNoteAccess, { noteId, userId });
    if (!hasAccess) {
      throw new Error("No access to this note");
    }

    const note = await ctx.db.get(noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    // Get current sequence number
    const currentSequence = await ctx.runQuery(internal.textOperations.getCurrentSequenceNumber, { noteId });

    // Get recent collaborators (users who have operations in the last hour)
    const recentOps = await ctx.db
      .query("text_operations")
      .withIndex("by_note", (q) => q.eq("noteId", noteId))
      .filter((q) => q.gt(q.field("timestamp"), Date.now() - 3600000)) // Last hour
      .collect();

    const collaborators = [...new Set(recentOps.map(op => op.userId))];

    return {
      content: note.content || "",
      sequenceNumber: currentSequence,
      lastModified: note.updatedAt,
      collaborators,
    };
  },
});

/**
 * Get operation history for a note (for debugging/audit)
 */
export const getOperationHistory = query({
  args: {
    noteId: v.id("notes"),
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    operationId: v.string(),
    userId: v.string(),
    sequenceNumber: v.number(),
    operation: textOperationValidator,
    timestamp: v.number(),
    transformedFrom: v.optional(v.array(v.string())),
  })),
  handler: async (ctx, args) => {
    const { noteId, userId, limit = 100 } = args;

    // Verify user has access to the note
    const hasAccess = await ctx.runQuery(internal.textOperations.checkNoteAccess, { noteId, userId });
    if (!hasAccess) {
      throw new Error("No access to this note");
    }

    const operations = await ctx.db
      .query("text_operations")
      .withIndex("by_note_sequence", (q) => q.eq("noteId", noteId))
      .filter((q) => q.eq(q.field("isCommitted"), true))
      .order("desc")
      .take(limit);

    return operations.map(op => ({
      operationId: op.operationId,
      userId: op.userId,
      sequenceNumber: op.sequenceNumber,
      operation: op.operation,
      timestamp: op.timestamp,
      transformedFrom: op.transformedFrom,
    }));
  },
});

// ============================================================================
// INTERNAL FUNCTIONS
// ============================================================================

/**
 * Check if user has edit access to a note
 */
export const checkNoteEditAccess = internalQuery({
  args: {
    noteId: v.id("notes"),
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { noteId, userId } = args;

    // Check if user has edit permission through sharing
    const shareRecord = await ctx.db
      .query("shared_notes")
      .withIndex("by_note_user", (q) => 
        q.eq("noteId", noteId).eq("sharedWithUserId", userId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .filter((q) => q.eq(q.field("permission"), "edit"))
      .unique();

    return !!shareRecord;
  },
});

/**
 * Check if user has any access to a note
 */
export const checkNoteAccess = internalQuery({
  args: {
    noteId: v.id("notes"),
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { noteId, userId } = args;

    const note = await ctx.db.get(noteId);
    if (!note) return false;

    // Owner has access
    if (note.userId === userId) return true;

    // Check shared access
    const shareRecord = await ctx.db
      .query("shared_notes")
      .withIndex("by_note_user", (q) => 
        q.eq("noteId", noteId).eq("sharedWithUserId", userId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .unique();

    return !!shareRecord;
  },
});

/**
 * Get current sequence number for a note
 */
export const getCurrentSequenceNumber = internalQuery({
  args: {
    noteId: v.id("notes"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const { noteId } = args;

    const lastOp = await ctx.db
      .query("text_operations")
      .withIndex("by_note_sequence", (q) => q.eq("noteId", noteId))
      .filter((q) => q.eq(q.field("isCommitted"), true))
      .order("desc")
      .first();

    return lastOp?.sequenceNumber || 0;
  },
});

/**
 * Get operations since a specific sequence number
 */
export const getOperationsSinceSequence = internalQuery({
  args: {
    noteId: v.id("notes"),
    sinceSequence: v.number(),
  },
  returns: v.array(v.object({
    operationId: v.string(),
    operation: textOperationValidator,
    sequenceNumber: v.number(),
  })),
  handler: async (ctx, args) => {
    const { noteId, sinceSequence } = args;

    const operations = await ctx.db
      .query("text_operations")
      .withIndex("by_note_sequence", (q) => 
        q.eq("noteId", noteId).gt("sequenceNumber", sinceSequence)
      )
      .filter((q) => q.eq(q.field("isCommitted"), true))
      .order("asc")
      .collect();

    return operations.map(op => ({
      operationId: op.operationId,
      operation: op.operation,
      sequenceNumber: op.sequenceNumber,
    }));
  },
});

/**
 * Apply an operation to the note content
 */
export const applyOperationToNote = internalMutation({
  args: {
    noteId: v.id("notes"),
    operation: textOperationValidator,
    sequenceNumber: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { noteId, operation, sequenceNumber } = args;

    const note = await ctx.db.get(noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    const currentContent = note.content || "";
    const newContent = applyOperation(currentContent, operation);

    await ctx.db.patch(noteId, {
      content: newContent,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Schedule snapshot creation if needed
 */
export const scheduleSnapshotIfNeeded = internalMutation({
  args: {
    noteId: v.id("notes"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { noteId } = args;

    // Get the latest snapshot
    const latestSnapshot = await ctx.db
      .query("note_snapshots")
      .withIndex("by_note_sequence", (q) => q.eq("noteId", noteId))
      .order("desc")
      .first();

    const currentSequence = await ctx.runQuery(internal.textOperations.getCurrentSequenceNumber, { noteId });
    const lastSnapshotSequence = latestSnapshot?.sequenceNumber || 0;
    const operationsSinceSnapshot = currentSequence - lastSnapshotSequence;

    // Create snapshot if more than 100 operations since last snapshot
    if (operationsSinceSnapshot >= 100) {
      await ctx.runMutation(internal.textOperations.createSnapshot, {
        noteId,
        reason: "operation_threshold",
      });
    }

    return null;
  },
});

/**
 * Create a snapshot of the current note state
 */
export const createSnapshot = internalMutation({
  args: {
    noteId: v.id("notes"),
    reason: v.union(
      v.literal("periodic"),
      v.literal("operation_threshold"),
      v.literal("manual"),
      v.literal("conflict_resolution")
    ),
    createdBy: v.optional(v.string()),
  },
  returns: v.id("note_snapshots"),
  handler: async (ctx, args) => {
    const { noteId, reason, createdBy = "system" } = args;

    const note = await ctx.db.get(noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    const currentSequence = await ctx.runQuery(internal.textOperations.getCurrentSequenceNumber, { noteId });
    const content = note.content || "";
    
    // Calculate operation count
    const operationCount = await ctx.db
      .query("text_operations")
      .withIndex("by_note", (q) => q.eq("noteId", noteId))
      .filter((q) => q.eq(q.field("isCommitted"), true))
      .collect()
      .then(ops => ops.length);

    // Simple checksum (MD5 would be better in production)
    const checksum = Buffer.from(content).toString('base64').slice(0, 32);

    const snapshotId = await ctx.db.insert("note_snapshots", {
      noteId,
      content,
      sequenceNumber: currentSequence,
      operationCount,
      checksum,
      createdAt: Date.now(),
      createdBy,
      snapshotReason: reason,
    });

    return snapshotId;
  },
});
