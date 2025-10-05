/**
 * Conversation Messages Migration Script
 * 
 * Migrates messages from conversations.messages array to individual messages table entries.
 * Safe, incremental migration with verification and rollback capability.
 * 
 * USAGE:
 * 1. Deploy schema changes first
 * 2. Run this mutation in batches via Convex dashboard or API
 * 3. Monitor progress via by_migrated index
 * 4. Verify data integrity before removing legacy fields
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Migrate a batch of conversations from array to messages table
 * Safe to run multiple times (idempotent)
 */
export const migrateBatch = internalMutation({
  args: {
    batchSize: v.number(),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    
    // Find unmigrated conversations (no index on _migrated, so this will be slower)
    const allConversations = await ctx.db
      .query("conversations")
      .collect();
    
    const conversations = allConversations
      .filter(c => !c._migrated)
      .slice(0, args.batchSize);

    if (conversations.length === 0) {
      return {
        success: true,
        migrated: 0,
        message: "No more conversations to migrate",
        duration_ms: Date.now() - startTime,
      };
    }

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const conv of conversations) {
      try {
        await migrateConversation(ctx, conv);
        successCount++;
      } catch (error: any) {
        failureCount++;
        errors.push(`Conversation ${conv._id}: ${error.message}`);
        console.error(`Failed to migrate conversation ${conv._id}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    
    console.log(
      `[MIGRATION] Batch complete: ${successCount} succeeded, ${failureCount} failed, ${duration}ms`
    );

    return {
      success: failureCount === 0,
      migrated: successCount,
      failed: failureCount,
      errors: errors.length > 0 ? errors : undefined,
      duration_ms: duration,
    };
  },
});

/**
 * Migrate a single conversation
 * Helper function called by migrateBatch
 */
async function migrateConversation(ctx: any, conv: any) {
  const messages = conv.messages || [];
  
  // Skip if no messages
  if (messages.length === 0) {
    await ctx.db.patch(conv._id, {
      _migrated: true,
      _migration_verified: true,
      messageCount: conv.messageCount !== undefined ? conv.messageCount : 0,
      lastMessageAt: conv.lastMessageAt,
    });
    return;
  }

  // Migrate each message to messages table
  const migratedMessageIds: string[] = [];
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    
    // Create timestamp if missing (use conversation createdAt + offset)
    const timestamp = msg.timestamp || (conv.createdAt + i * 1000);
    
    const messageId = await ctx.db.insert("messages", {
      conversationId: conv._id,
      userId: conv.userId,
      content: msg.content,
      role: msg.role,
      sequence: i,  // Explicit sequence number
      timestamp,
      context: msg.context,
      fileAttachments: msg.fileAttachments,
      enrichment_metadata: msg.enrichment_metadata,
      createdAt: timestamp,
      updatedAt: conv.updatedAt || timestamp,
    });
    
    migratedMessageIds.push(messageId);
  }

  // Get last message timestamp
  const lastMessage = messages[messages.length - 1];
  const lastMessageTimestamp = lastMessage.timestamp || (conv.createdAt + (messages.length - 1) * 1000);

  // Update conversation with migration metadata
  // Only update messageCount if not already set (avoid overwriting dual-write updates)
  await ctx.db.patch(conv._id, {
    _migrated: true,
    _migration_verified: false,  // Will be set to true after verification
    messageCount: conv.messageCount !== undefined ? conv.messageCount : messages.length,
    lastMessageAt: conv.lastMessageAt || lastMessageTimestamp,
  });

  console.log(
    `[MIGRATION] Migrated conversation ${conv._id}: ${messages.length} messages`
  );
}

/**
 * Verify migration integrity for a batch
 * Checks that migrated data matches original data
 */
export const verifyBatch = internalMutation({
  args: {
    batchSize: v.number(),
  },
  handler: async (ctx, args) => {
    // Find migrated but unverified conversations
    const allConversations = await ctx.db
      .query("conversations")
      .collect();
    
    const conversations = allConversations
      .filter(c => c._migrated && !c._migration_verified)
      .slice(0, args.batchSize);

    if (conversations.length === 0) {
      return {
        success: true,
        verified: 0,
        message: "No conversations to verify",
      };
    }

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const conv of conversations) {
      try {
        const isValid = await verifyConversation(ctx, conv);
        
        if (isValid) {
          await ctx.db.patch(conv._id, {
            _migration_verified: true,
          });
          successCount++;
        } else {
          failureCount++;
          errors.push(`Conversation ${conv._id}: Data mismatch detected`);
        }
      } catch (error: any) {
        failureCount++;
        errors.push(`Conversation ${conv._id}: ${error.message}`);
      }
    }

    return {
      success: failureCount === 0,
      verified: successCount,
      failed: failureCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});

/**
 * Verify a single conversation's migration
 */
async function verifyConversation(ctx: any, conv: any): Promise<boolean> {
  const originalMessages = conv.messages || [];
  
  // Get migrated messages
  const migratedMessages = await ctx.db
    .query("messages")
    .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
    .order("asc")
    .collect();

  // Check count matches
  if (originalMessages.length !== migratedMessages.length) {
    console.error(
      `[VERIFY] Count mismatch for ${conv._id}: ` +
      `original=${originalMessages.length}, migrated=${migratedMessages.length}`
    );
    return false;
  }

  // Check each message
  for (let i = 0; i < originalMessages.length; i++) {
    const original = originalMessages[i];
    const migrated = migratedMessages[i];

    if (
      original.content !== migrated.content ||
      original.role !== migrated.role ||
      migrated.sequence !== i
    ) {
      console.error(
        `[VERIFY] Message mismatch at index ${i} for ${conv._id}`
      );
      return false;
    }
  }

  return true;
}

/**
 * Get migration progress statistics
 */
export const getMigrationProgress = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allConversations = await ctx.db.query("conversations").collect();
    
    const total = allConversations.length;
    const migrated = allConversations.filter(c => c._migrated).length;
    const verified = allConversations.filter(c => c._migration_verified).length;
    const pending = total - migrated;

    // Get sample of unmigrated for debugging
    const unmigrated = allConversations.filter(c => !c._migrated).slice(0, 5);
    
    return {
      total,
      migrated,
      verified,
      pending,
      progress_percent: total > 0 ? Math.round((migrated / total) * 100) : 0,
      verified_percent: migrated > 0 ? Math.round((verified / migrated) * 100) : 0,
      sample_unmigrated_ids: unmigrated.map(c => c._id),
    };
  },
});

/**
 * Rollback a single conversation migration (emergency use only)
 * Removes migrated messages and resets migration flags
 */
export const rollbackConversation = internalMutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) {
      throw new Error("Conversation not found");
    }

    // Delete all migrated messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    // Reset migration flags
    await ctx.db.patch(args.conversationId, {
      _migrated: undefined,
      _migration_verified: undefined,
      messageCount: conv.messages?.length || 0,
      lastMessageAt: undefined,
    });

    return {
      success: true,
      messages_deleted: messages.length,
    };
  },
});

