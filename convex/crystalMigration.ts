import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Crystal Migration System
 * 
 * Minimal, production-ready one-time migration that leverages existing crystal dam infrastructure.
 * Processes user's last 14 days of content through the battle-tested crystal formation pipeline.
 */

const MIGRATION_TYPE = "crystal_initial_generation";

/**
 * Check if user needs crystal migration
 */
export const checkNeedsMigration = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    console.log(`🔍 [MIGRATION CHECK] Checking migration status for user: ${userId}`);
    
    const existing = await ctx.db
      .query("migration_tracking")
      .withIndex("by_user_type", (q) => 
        q.eq("userId", userId).eq("migrationType", MIGRATION_TYPE)
      )
      .first();

    console.log(`🔍 [MIGRATION CHECK] Existing migration record for user ${userId}:`, existing);

    const result = {
      needsMigration: !existing?.completed,
      lastAttempt: existing?.lastAttemptAt,
      attempts: existing?.attempts || 0,
      contentProcessed: existing?.contentProcessed
    };
    
    console.log(`🔍 [MIGRATION CHECK] Migration check result for user ${userId}:`, result);
    
    return result;
  }
});

/**
 * Mark migration as completed
 */
export const markMigrationComplete = mutation({
  args: { 
    userId: v.string(),
    contentProcessed: v.optional(v.object({
      conversations: v.number(),
      notes: v.number(),
      totalItems: v.number()
    }))
  },
  handler: async (ctx, { userId, contentProcessed }) => {
    const existing = await ctx.db
      .query("migration_tracking")
      .withIndex("by_user_type", (q) => 
        q.eq("userId", userId).eq("migrationType", MIGRATION_TYPE)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed: true,
        completedAt: now,
        contentProcessed: contentProcessed || existing.contentProcessed
      });
    } else {
      await ctx.db.insert("migration_tracking", {
        userId,
        migrationType: MIGRATION_TYPE,
        completed: true,
        completedAt: now,
        attempts: 1,
        lastAttemptAt: now,
        contentProcessed: contentProcessed || { conversations: 0, notes: 0, totalItems: 0 }
      });
    }

    return { success: true };
  }
});

/**
 * Record migration attempt (for failure tracking)
 */
export const recordMigrationAttempt = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const existing = await ctx.db
      .query("migration_tracking")
      .withIndex("by_user_type", (q) => 
        q.eq("userId", userId).eq("migrationType", MIGRATION_TYPE)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        attempts: (existing.attempts || 0) + 1,
        lastAttemptAt: now
      });
    } else {
      await ctx.db.insert("migration_tracking", {
        userId,
        migrationType: MIGRATION_TYPE,
        completed: false,
        attempts: 1,
        lastAttemptAt: now
      });
    }

    return { success: true };
  }
});

/**
 * Get recent content for migration (last 14 days)
 */
export const getRecentContentForMigration = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
    
    // Get recent conversations
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("createdAt"), fourteenDaysAgo))
      .order("desc")
      .take(25); // Reasonable limit for processing

    // Get recent notes  
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("createdAt"), fourteenDaysAgo))
      .order("desc")
      .take(25); // Reasonable limit for processing

    return {
      conversations: conversations.map(conv => ({
        _id: conv._id,
        title: conv.title,
        content: conv.messages.map(m => m.content).join('\n\n'),
        createdAt: conv.createdAt,
        type: 'conversation'
      })),
      notes: notes.map(note => ({
        _id: note._id,
        title: note.title || 'Untitled Note',
        content: note.content || '',
        createdAt: note.createdAt,
        type: 'note'
      }))
    };
  }
});

/**
 * Main migration action - leverages existing crystal dam system
 */
export const triggerCrystalMigration = action({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    console.log(`🔮 [MIGRATION] Starting crystal migration for user: ${userId}`);

    try {
      console.log(`🔮 [MIGRATION] Step 1: Checking if migration needed for user: ${userId}`);
      
      // 1. Check if migration needed
      const migrationCheck = await ctx.runQuery(api.crystalMigration.checkNeedsMigration, { userId });
      
      console.log(`🔮 [MIGRATION] Migration check result for user ${userId}:`, migrationCheck);

      if (!migrationCheck.needsMigration) {
        console.log(`🔮 [MIGRATION] User ${userId} already migrated, skipping`);
        return {
          success: true,
          skipped: true,
          reason: "already_completed",
          message: "Crystal migration already completed",
          contentProcessed: migrationCheck.contentProcessed
        };
      }

      console.log(`🔮 [MIGRATION] Step 2: Recording migration attempt for user: ${userId}`);
      
      // Record attempt for tracking
      await ctx.runMutation(api.crystalMigration.recordMigrationAttempt, { userId });

      console.log(`🔮 [MIGRATION] Step 3: Getting recent content for user: ${userId}`);
      
      // 2. Get recent content
      const recentContent = await ctx.runQuery(api.crystalMigration.getRecentContentForMigration, { userId });
      
      console.log(`🔮 [MIGRATION] Recent content found for user ${userId}: ${recentContent.conversations.length} conversations, ${recentContent.notes.length} notes`);

      const totalItems = recentContent.conversations.length + recentContent.notes.length;

      if (totalItems === 0) {
        console.log(`🔮 [MIGRATION] No recent content found for user ${userId}`);
        
        // Mark as completed even with no content
        await ctx.runMutation(api.crystalMigration.markMigrationComplete, {
          userId,
          contentProcessed: { conversations: 0, notes: 0, totalItems: 0 }
        });

        return {
          success: true,
          skipped: true,
          reason: "no_content",
          message: "No recent content to process",
          contentProcessed: { conversations: 0, notes: 0, totalItems: 0 }
        };
      }

      console.log(`🔮 [MIGRATION] Found ${totalItems} items for user ${userId} (${recentContent.conversations.length} conversations, ${recentContent.notes.length} notes)`);

      console.log(`🔮 [MIGRATION] Step 4: Preparing to call backend for user: ${userId}`);
      
      // 3. Call backend migration endpoint (leverages existing crystal dam)
      const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
      
      console.log(`🔮 [MIGRATION] Backend URL: ${BACKEND_URL}`);
      
      // Format content for crystal dam processing
      const contentItems = [
        ...recentContent.conversations.map(conv => ({
          content: conv.content,
          source: 'conversation',
          source_id: conv._id,
          title: conv.title,
          created_at: conv.createdAt
        })),
        ...recentContent.notes.map(note => ({
          content: `${note.title}\n\n${note.content}`,
          source: 'note',
          source_id: note._id,
          title: note.title,
          created_at: note.createdAt
        }))
      ];

      console.log(`🔮 [MIGRATION] Step 5: Calling backend with ${contentItems.length} content items for user: ${userId}`);
      
      // Get system API key for internal service authentication
      const systemApiKey = process.env.BACKEND_API_KEY;
      if (!systemApiKey) {
        throw new Error("BACKEND_API_KEY not configured - required for system authentication");
      }
      
      // Call backend migration endpoint with system authentication
      // System keys (userId starting with "system_" or "service_") can operate on behalf of any user
      const migrationResponse = await fetch(`${BACKEND_URL}/api/v1/migration/bulk-add-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${systemApiKey}`,
        },
        body: JSON.stringify({
          user_id: userId,
          content_items: contentItems,
          force_formation: true // Override normal dam thresholds
        }),
      });
      
      console.log(`🔮 [MIGRATION] Backend response status for user ${userId}: ${migrationResponse.status}`);

      if (!migrationResponse.ok) {
        const errorText = await migrationResponse.text();
        throw new Error(`Backend migration failed: ${migrationResponse.status} ${errorText}`);
      }

      const migrationResult = await migrationResponse.json();

      console.log(`🔮 [MIGRATION] Backend processing completed for user ${userId}:`, {
        itemsAdded: migrationResult.items_added || 0,
        shardsCreated: migrationResult.shards_created || 0,
        crystalsCreated: migrationResult.crystals_created || 0
      });

      // 4. Mark migration as completed
      await ctx.runMutation(api.crystalMigration.markMigrationComplete, {
        userId,
        contentProcessed: {
          conversations: recentContent.conversations.length,
          notes: recentContent.notes.length,
          totalItems
        }
      });

      console.log(`✅ [MIGRATION] Crystal migration completed successfully for user ${userId}`);

      return {
        success: true,
        skipped: false,
        contentProcessed: {
          conversations: recentContent.conversations.length,
          notes: recentContent.notes.length,
          totalItems
        },
        crystalSystemResults: {
          itemsAdded: migrationResult.items_added || 0,
          shardsCreated: migrationResult.shards_created || 0,
          crystalsCreated: migrationResult.crystals_created || 0
        },
        message: "Crystal migration completed successfully"
      };

    } catch (error) {
      console.error(`❌ [MIGRATION] Crystal migration failed for user ${userId}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Crystal migration failed"
      };
    }
  }
});

/**
 * Admin query to check migration status across users
 */
export const getMigrationStats = query({
  args: {},
  handler: async (ctx) => {
    const allMigrations = await ctx.db
      .query("migration_tracking")
      .withIndex("by_type", (q) => q.eq("migrationType", MIGRATION_TYPE))
      .collect();

    const completed = allMigrations.filter(m => m.completed).length;
    const pending = allMigrations.filter(m => !m.completed).length;
    const totalContent = allMigrations
      .filter(m => m.contentProcessed)
      .reduce((sum, m) => sum + (m.contentProcessed?.totalItems || 0), 0);

    return {
      total: allMigrations.length,
      completed,
      pending,
      totalContentProcessed: totalContent,
      completionRate: allMigrations.length > 0 ? (completed / allMigrations.length) * 100 : 0
    };
  }
});
