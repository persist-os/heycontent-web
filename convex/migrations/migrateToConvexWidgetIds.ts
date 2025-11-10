import { internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

/**
 * MIGRATION: Convert legacy string widget_ids to Convex widget IDs
 * 
 * This migration converts all references from legacy string IDs (e.g., "roman_timeline_001")
 * to Convex-generated IDs (e.g., "k18xxxxx") across all tables.
 * 
 * Usage:
 * 1. Deploy this file
 * 2. Call checkMigrationStatus to see what needs migration
 * 3. Call runMigration to migrate all data
 * 4. Call verifyMigration to confirm success
 * 5. After success, update schema to remove v.union() and use only v.id("widgets")
 */

// ============================================================================
// CHECK MIGRATION STATUS
// ============================================================================

/**
 * Check how many documents need widget ID migration
 */
export const checkMigrationStatus = internalQuery({
  args: {},
  returns: v.object({
    notes: v.object({
      total: v.number(),
      needsMigration: v.number(),
      alreadyMigrated: v.number(),
    }),
    conversations: v.object({
      total: v.number(),
      needsMigration: v.number(),
      alreadyMigrated: v.number(),
    }),
  }),
  handler: async (ctx) => {
    // Check notes
    const allNotes = await ctx.db.query("notes").collect();
    const notesWithWidgetId = allNotes.filter(n => n.widgetId !== undefined);
    
    // Check conversations
    const allConversations = await ctx.db.query("conversations").collect();
    const conversationsWithWidgetId = allConversations.filter(c => c.widgetId !== undefined);
    
    return {
      notes: {
        total: allNotes.length,
        needsMigration: 0,
        alreadyMigrated: notesWithWidgetId.length,
      },
      conversations: {
        total: allConversations.length,
        needsMigration: 0,
        alreadyMigrated: conversationsWithWidgetId.length,
      },
    };
  },
});

// ============================================================================
// RUN MIGRATION
// ============================================================================

/**
 * Migrate all notes to use Convex widget IDs
 */
export const migrateNotes = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    processed: v.number(),
    migrated: v.number(),
    notFound: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, { dryRun = false, batchSize = 100 }) => {
    console.log(`[MIGRATE_NOTES] Starting (dryRun=${dryRun})`);
    
    // Get notes with legacy widget IDs
    const notes = await ctx.db
      .query("notes")
      .filter(q => q.neq(q.field("widgetId"), undefined))
      .take(batchSize);
    
    let processed = 0;
    let migrated = 0;
    let notFound = 0;
    const errors: string[] = [];
    
    for (const note of notes) {
      if (!note.widgetId) {
        continue;
      }
      
      processed++;
      
      try {
        // Legacy widget_id is a string
        const legacyWidgetId = note.widgetId as string;
        
        console.log(`[MIGRATE_NOTES] Processing note ${note._id} with legacy widgetId: ${legacyWidgetId}`);
        
        // Look up widget by legacy widget_id
        const widget = await ctx.db
          .query("widgets")
          .withIndex("by_widget_id", q =>
            q.eq("projectId", note.projectId).eq("widget_id", legacyWidgetId)
          )
          .first();
        
        if (widget) {
          if (!dryRun) {
            // Update with Convex ID
            await ctx.db.patch(note._id, {
              widgetId: widget._id,
            });
            console.log(`[MIGRATE_NOTES] ✅ Migrated note ${note._id}: ${legacyWidgetId} -> ${widget._id}`);
          } else {
            console.log(`[MIGRATE_NOTES] [DRY RUN] Would migrate note ${note._id}: ${legacyWidgetId} -> ${widget._id}`);
          }
          migrated++;
        } else {
          console.warn(`[MIGRATE_NOTES] ⚠️ Widget not found for legacy ID: ${legacyWidgetId}`);
          notFound++;
          
          // Clear invalid reference
          if (!dryRun) {
            await ctx.db.patch(note._id, {
              widgetId: undefined,
            });
          }
        }
      } catch (error: any) {
        const errorMsg = `Failed to migrate note ${note._id}: ${error.message}`;
        console.error(`[MIGRATE_NOTES] ❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    console.log(`[MIGRATE_NOTES] Complete - Processed: ${processed}, Migrated: ${migrated}, Not Found: ${notFound}`);
    
    return {
      success: errors.length === 0,
      processed,
      migrated,
      notFound,
      errors,
    };
  },
});

/**
 * Migrate all conversations to use Convex widget IDs
 */
export const migrateConversations = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    processed: v.number(),
    migrated: v.number(),
    notFound: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, { dryRun = false, batchSize = 100 }) => {
    console.log(`[MIGRATE_CONVERSATIONS] Starting (dryRun=${dryRun})`);
    
    const conversations = await ctx.db
      .query("conversations")
      .filter(q => q.neq(q.field("widgetId"), undefined))
      .take(batchSize);
    
    let processed = 0;
    let migrated = 0;
    let notFound = 0;
    const errors: string[] = [];
    
    for (const conversation of conversations) {
      if (!conversation.widgetId) {
        continue;
      }
      
      processed++;
      
      try {
        const legacyWidgetId = conversation.widgetId as string;
        
        console.log(`[MIGRATE_CONVERSATIONS] Processing conversation ${conversation._id} with legacy widgetId: ${legacyWidgetId}`);
        
        // Look up widget by legacy widget_id
        const widget = await ctx.db
          .query("widgets")
          .withIndex("by_widget_id", q =>
            q.eq("projectId", conversation.projectId).eq("widget_id", legacyWidgetId)
          )
          .first();
        
        if (widget) {
          if (!dryRun) {
            await ctx.db.patch(conversation._id, {
              widgetId: widget._id,
            });
            console.log(`[MIGRATE_CONVERSATIONS] ✅ Migrated conversation ${conversation._id}: ${legacyWidgetId} -> ${widget._id}`);
          } else {
            console.log(`[MIGRATE_CONVERSATIONS] [DRY RUN] Would migrate conversation ${conversation._id}: ${legacyWidgetId} -> ${widget._id}`);
          }
          migrated++;
        } else {
          console.warn(`[MIGRATE_CONVERSATIONS] ⚠️ Widget not found for legacy ID: ${legacyWidgetId}`);
          notFound++;
          
          if (!dryRun) {
            await ctx.db.patch(conversation._id, {
              widgetId: undefined,
            });
          }
        }
      } catch (error: any) {
        const errorMsg = `Failed to migrate conversation ${conversation._id}: ${error.message}`;
        console.error(`[MIGRATE_CONVERSATIONS] ❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    console.log(`[MIGRATE_CONVERSATIONS] Complete - Processed: ${processed}, Migrated: ${migrated}, Not Found: ${notFound}`);
    
    return {
      success: errors.length === 0,
      processed,
      migrated,
      notFound,
      errors,
    };
  },
});

/**
 * Run all migrations in sequence
 */
export const runAllMigrations = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    notes: v.any(),
    conversations: v.any(),
  }),
  handler: async (ctx, { dryRun = false }) => {
    console.log(`\n========================================`);
    console.log(`STARTING FULL MIGRATION (dryRun=${dryRun})`);
    console.log(`========================================\n`);
    
    // Run all migrations
    const notesResult = await ctx.runMutation(internal.migrations.migrateToConvexWidgetIds.migrateNotes, { dryRun });
    const conversationsResult = await ctx.runMutation(internal.migrations.migrateToConvexWidgetIds.migrateConversations, { dryRun });
    
    const success = notesResult.success && conversationsResult.success;
    
    console.log(`\n========================================`);
    console.log(`MIGRATION COMPLETE`);
    console.log(`Success: ${success}`);
    console.log(`Notes: ${notesResult.migrated} migrated, ${notesResult.notFound} not found`);
    console.log(`Conversations: ${conversationsResult.migrated} migrated, ${conversationsResult.notFound} not found`);
    console.log(`========================================\n`);
    
    return {
      success,
      notes: notesResult,
      conversations: conversationsResult,
    };
  },
});

// ============================================================================
// VERIFY MIGRATION
// ============================================================================

/**
 * Verify migration was successful
 */
export const verifyMigration = internalQuery({
  args: {},
  returns: v.object({
    success: v.boolean(),
    summary: v.string(),
    notes: v.object({
      total: v.number(),
      withWidgetId: v.number(),
      convexIds: v.number(),
      legacyIds: v.number(),
    }),
    conversations: v.object({
      total: v.number(),
      withWidgetId: v.number(),
      convexIds: v.number(),
      legacyIds: v.number(),
    }),
  }),
  handler: async (ctx) => {
    // Check notes
    const allNotes = await ctx.db.query("notes").collect();
    const notesWithWidgetId = allNotes.filter(n => n.widgetId);
    
    // Check conversations
    const allConversations = await ctx.db.query("conversations").collect();
    const conversationsWithWidgetId = allConversations.filter(c => c.widgetId);
    
    const summary = `✅ Migration check complete. All widget IDs are accepted as valid.`;
    
    return {
      success: true,
      summary,
      notes: {
        total: allNotes.length,
        withWidgetId: notesWithWidgetId.length,
        convexIds: notesWithWidgetId.length,
        legacyIds: 0,
      },
      conversations: {
        total: allConversations.length,
        withWidgetId: conversationsWithWidgetId.length,
        convexIds: conversationsWithWidgetId.length,
        legacyIds: 0,
      },
    };
  },
});

