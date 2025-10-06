/**
 * Conversation Messages Migration Script
 * 
 * Migrates messages from conversations.messages array to individual messages table entries.
 * Safe, incremental migration with verification and rollback capability.
 * 
 * USAGE - SIMPLIFIED:
 * Just run `runFullMigration()` from the Convex dashboard and it handles everything!
 * 
 * Advanced:
 * - Monitor progress: getMigrationStatus()
 * - Run migration only: autoMigrateContinuous()
 * - Run verification only: autoVerifyContinuous()
 * - Rollback a conversation: rollbackConversation(conversationId)
 */

import { internalMutation, query } from "../_generated/server";
import { v } from "convex/values";

// Configuration
const DEFAULT_BATCH_SIZE = 50; // Process 50 conversations at a time
const MAX_BATCHES_PER_RUN = 100; // Prevent infinite loops
const RETRY_FAILED_MIGRATIONS = true;

/**
 * 🚀 ONE-COMMAND FULL MIGRATION
 * Run this to migrate and verify all conversations automatically.
 * Handles batching, retries, verification, and progress tracking.
 */
export const runFullMigration = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const batchSize = args.batchSize || DEFAULT_BATCH_SIZE;
    
    console.log("🚀 Starting full migration process...");
    
    // Step 1: Run migration
    console.log("📊 Step 1/3: Running migration...");
    const migrationResult = await runAutoMigration(ctx, batchSize);
    
    // Step 2: Run verification
    console.log("✅ Step 2/3: Running verification...");
    const verificationResult = await runAutoVerification(ctx, batchSize);
    
    // Step 3: Get final status
    console.log("📈 Step 3/3: Getting final status...");
    const status = await getMigrationStatusHelper(ctx);
    
    const duration = Date.now() - startTime;
    
    return {
      success: status.pending === 0 && status.unverified === 0,
      migration: migrationResult,
      verification: verificationResult,
      finalStatus: status,
      duration_ms: duration,
      duration_readable: `${Math.round(duration / 1000)}s`,
    };
  },
});

/**
 * 🔄 AUTO MIGRATE CONTINUOUSLY
 * Automatically processes all unmigrated conversations in batches.
 * Stops when all conversations are migrated.
 */
export const autoMigrateContinuous = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || DEFAULT_BATCH_SIZE;
    return await runAutoMigration(ctx, batchSize);
  },
});

/**
 * ✅ AUTO VERIFY CONTINUOUSLY
 * Automatically verifies all migrated conversations in batches.
 * Stops when all conversations are verified.
 */
export const autoVerifyContinuous = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || DEFAULT_BATCH_SIZE;
    return await runAutoVerification(ctx, batchSize);
  },
});

/**
 * 📊 GET MIGRATION STATUS (Query)
 * Public query to check migration progress without running mutations
 */
export const getMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    return await getMigrationStatusHelper(ctx);
  },
});

// ============================================================================
// HELPER FUNCTIONS FOR AUTO MIGRATION
// ============================================================================

async function runAutoMigration(ctx: any, batchSize: number) {
  const startTime = Date.now();
  let totalMigrated = 0;
  let totalFailed = 0;
  let batchCount = 0;
  const allErrors: string[] = [];
  
  while (batchCount < MAX_BATCHES_PER_RUN) {
    // Get unmigrated count
    const allConversations = await ctx.db.query("conversations").collect();
    const unmigrated = allConversations.filter(c => !c.migrated);
    
    if (unmigrated.length === 0) {
      console.log("✅ All conversations migrated!");
      break;
    }
    
    console.log(`📦 Batch ${batchCount + 1}: Processing ${Math.min(batchSize, unmigrated.length)} of ${unmigrated.length} remaining...`);
    
    // Process one batch
    const conversations = unmigrated.slice(0, batchSize);
    let batchSuccess = 0;
    let batchFailed = 0;
    
    for (const conv of conversations) {
      try {
        await migrateConversation(ctx, conv);
        batchSuccess++;
        totalMigrated++;
      } catch (error: any) {
        batchFailed++;
        totalFailed++;
        const errorMsg = `${conv._id}: ${error.message}`;
        allErrors.push(errorMsg);
        console.error(`❌ Failed to migrate conversation ${errorMsg}`);
      }
    }
    
    console.log(`✅ Batch ${batchCount + 1} complete: ${batchSuccess} succeeded, ${batchFailed} failed`);
    batchCount++;
    
    // If we failed all in this batch and retries are disabled, stop
    if (batchFailed === conversations.length && !RETRY_FAILED_MIGRATIONS) {
      console.error("❌ Entire batch failed, stopping migration");
      break;
    }
  }
  
  const duration = Date.now() - startTime;
  
  return {
    success: totalFailed === 0,
    totalMigrated,
    totalFailed,
    batchesProcessed: batchCount,
    errors: allErrors.length > 0 ? allErrors.slice(0, 10) : undefined, // First 10 errors
    duration_ms: duration,
    hitMaxBatches: batchCount >= MAX_BATCHES_PER_RUN,
  };
}

async function runAutoVerification(ctx: any, batchSize: number) {
  const startTime = Date.now();
  let totalVerified = 0;
  let totalFailed = 0;
  let batchCount = 0;
  const allErrors: string[] = [];
  
  while (batchCount < MAX_BATCHES_PER_RUN) {
    // Get unverified count
    const allConversations = await ctx.db.query("conversations").collect();
    const unverified = allConversations.filter(c => c.migrated && !c.migrationVerified);
    
    if (unverified.length === 0) {
      console.log("✅ All conversations verified!");
      break;
    }
    
    console.log(`🔍 Verification batch ${batchCount + 1}: Checking ${Math.min(batchSize, unverified.length)} of ${unverified.length} remaining...`);
    
    // Process one batch
    const conversations = unverified.slice(0, batchSize);
    let batchSuccess = 0;
    let batchFailed = 0;
    
    for (const conv of conversations) {
      try {
        const isValid = await verifyConversation(ctx, conv);
        
        if (isValid) {
          await ctx.db.patch(conv._id, { migrationVerified: true });
          batchSuccess++;
          totalVerified++;
        } else {
          batchFailed++;
          totalFailed++;
          allErrors.push(`${conv._id}: Data mismatch detected`);
        }
      } catch (error: any) {
        batchFailed++;
        totalFailed++;
        const errorMsg = `${conv._id}: ${error.message}`;
        allErrors.push(errorMsg);
        console.error(`❌ Failed to verify conversation ${errorMsg}`);
      }
    }
    
    console.log(`✅ Verification batch ${batchCount + 1} complete: ${batchSuccess} verified, ${batchFailed} failed`);
    batchCount++;
  }
  
  const duration = Date.now() - startTime;
  
  return {
    success: totalFailed === 0,
    totalVerified,
    totalFailed,
    batchesProcessed: batchCount,
    errors: allErrors.length > 0 ? allErrors.slice(0, 10) : undefined,
    duration_ms: duration,
    hitMaxBatches: batchCount >= MAX_BATCHES_PER_RUN,
  };
}

async function getMigrationStatusHelper(ctx: any) {
  const allConversations = await ctx.db.query("conversations").collect();
  
  const total = allConversations.length;
  const migrated = allConversations.filter(c => c.migrated).length;
  const verified = allConversations.filter(c => c.migrationVerified).length;
  const pending = total - migrated;
  const unverified = migrated - verified;
  
  // Sample conversations in each state
  const sampleUnmigrated = allConversations
    .filter(c => !c.migrated)
    .slice(0, 3)
    .map(c => ({ id: c._id, messageCount: c.messages?.length || 0 }));
    
  const sampleUnverified = allConversations
    .filter(c => c.migrated && !c.migrationVerified)
    .slice(0, 3)
    .map(c => ({ id: c._id, messageCount: c.messageCount }));
  
  return {
    total,
    migrated,
    verified,
    pending,
    unverified,
    progress_percent: total > 0 ? Math.round((migrated / total) * 100) : 100,
    verified_percent: migrated > 0 ? Math.round((verified / migrated) * 100) : 100,
    is_complete: pending === 0 && unverified === 0,
    sampleUnmigrated,
    sampleUnverified,
  };
}

// ============================================================================
// BATCH OPERATIONS (Legacy - prefer auto functions above)
// ============================================================================

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
    
    // Find unmigrated conversations (no index on migrated, so this will be slower)
    const allConversations = await ctx.db
      .query("conversations")
      .collect();
    
    const conversations = allConversations
      .filter(c => !c.migrated)
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
      migrated: true,
      migrationVerified: true,
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
    migrated: true,
    migrationVerified: false,  // Will be set to true after verification
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
      .filter(c => c.migrated && !c.migrationVerified)
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
            migrationVerified: true,
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
 * Get migration progress statistics (DEPRECATED - use getMigrationStatus instead)
 * Kept for backward compatibility
 */
export const getMigrationProgress = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await getMigrationStatusHelper(ctx);
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
      migrated: undefined,
      migrationVerified: undefined,
      messageCount: conv.messages?.length || 0,
      lastMessageAt: undefined,
    });

    return {
      success: true,
      messages_deleted: messages.length,
    };
  },
});

