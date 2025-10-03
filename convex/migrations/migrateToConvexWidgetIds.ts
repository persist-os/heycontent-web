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
    widgetOutputs: v.object({
      total: v.number(),
      needsMigration: v.number(),
      alreadyMigrated: v.number(),
    }),
  }),
  handler: async (ctx) => {
    // Check notes
    const allNotes = await ctx.db.query("notes").collect();
    const notesWithWidgetId = allNotes.filter(n => n.widgetId !== undefined);
    const notesNeedMigration = notesWithWidgetId.filter(n => 
      typeof n.widgetId === 'string' && !n.widgetId.startsWith('k')
    );
    
    // Check conversations
    const allConversations = await ctx.db.query("conversations").collect();
    const conversationsWithWidgetId = allConversations.filter(c => c.widgetId !== undefined);
    const conversationsNeedMigration = conversationsWithWidgetId.filter(c =>
      typeof c.widgetId === 'string' && !c.widgetId.startsWith('k')
    );
    
    // Check widget_outputs
    const allWidgetOutputs = await ctx.db.query("widget_outputs").collect();
    const outputsNeedMigration = allWidgetOutputs.filter(o =>
      typeof o.widgetId === 'string' && !o.widgetId.startsWith('k')
    );
    
    return {
      notes: {
        total: allNotes.length,
        needsMigration: notesNeedMigration.length,
        alreadyMigrated: notesWithWidgetId.length - notesNeedMigration.length,
      },
      conversations: {
        total: allConversations.length,
        needsMigration: conversationsNeedMigration.length,
        alreadyMigrated: conversationsWithWidgetId.length - conversationsNeedMigration.length,
      },
      widgetOutputs: {
        total: allWidgetOutputs.length,
        needsMigration: outputsNeedMigration.length,
        alreadyMigrated: allWidgetOutputs.length - outputsNeedMigration.length,
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
      // Skip if already a Convex ID
      if (!note.widgetId || (typeof note.widgetId === 'string' && note.widgetId.startsWith('k'))) {
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
      // Skip if already a Convex ID
      if (!conversation.widgetId || (typeof conversation.widgetId === 'string' && conversation.widgetId.startsWith('k'))) {
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
 * Migrate all widget outputs to use Convex widget IDs
 */
export const migrateWidgetOutputs = internalMutation({
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
    console.log(`[MIGRATE_WIDGET_OUTPUTS] Starting (dryRun=${dryRun})`);
    
    const widgetOutputs = await ctx.db
      .query("widget_outputs")
      .take(batchSize);
    
    let processed = 0;
    let migrated = 0;
    let notFound = 0;
    const errors: string[] = [];
    
    for (const output of widgetOutputs) {
      // Skip if already a Convex ID
      if (typeof output.widgetId === 'string' && output.widgetId.startsWith('k')) {
        continue;
      }
      
      processed++;
      
      try {
        const legacyWidgetId = output.widgetId as string;
        
        console.log(`[MIGRATE_WIDGET_OUTPUTS] Processing output ${output._id} with legacy widgetId: ${legacyWidgetId}`);
        
        // Look up widget by legacy widget_id
        const widget = await ctx.db
          .query("widgets")
          .withIndex("by_widget_id", q =>
            q.eq("projectId", output.projectId).eq("widget_id", legacyWidgetId)
          )
          .first();
        
        if (widget) {
          if (!dryRun) {
            await ctx.db.patch(output._id, {
              widgetId: widget._id,
            });
            console.log(`[MIGRATE_WIDGET_OUTPUTS] ✅ Migrated output ${output._id}: ${legacyWidgetId} -> ${widget._id}`);
          } else {
            console.log(`[MIGRATE_WIDGET_OUTPUTS] [DRY RUN] Would migrate output ${output._id}: ${legacyWidgetId} -> ${widget._id}`);
          }
          migrated++;
        } else {
          console.warn(`[MIGRATE_WIDGET_OUTPUTS] ⚠️ Widget not found for legacy ID: ${legacyWidgetId}`);
          notFound++;
          errors.push(`Widget not found for output ${output._id}: ${legacyWidgetId}`);
        }
      } catch (error: any) {
        const errorMsg = `Failed to migrate widget output ${output._id}: ${error.message}`;
        console.error(`[MIGRATE_WIDGET_OUTPUTS] ❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    console.log(`[MIGRATE_WIDGET_OUTPUTS] Complete - Processed: ${processed}, Migrated: ${migrated}, Not Found: ${notFound}`);
    
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
    widgetOutputs: v.any(),
  }),
  handler: async (ctx, { dryRun = false }) => {
    console.log(`\n========================================`);
    console.log(`STARTING FULL MIGRATION (dryRun=${dryRun})`);
    console.log(`========================================\n`);
    
    // Run all migrations
    const notesResult = await ctx.runMutation(internal.migrations.migrateToConvexWidgetIds.migrateNotes, { dryRun });
    const conversationsResult = await ctx.runMutation(internal.migrations.migrateToConvexWidgetIds.migrateConversations, { dryRun });
    const widgetOutputsResult = await ctx.runMutation(internal.migrations.migrateToConvexWidgetIds.migrateWidgetOutputs, { dryRun });
    
    const success = notesResult.success && conversationsResult.success && widgetOutputsResult.success;
    
    console.log(`\n========================================`);
    console.log(`MIGRATION COMPLETE`);
    console.log(`Success: ${success}`);
    console.log(`Notes: ${notesResult.migrated} migrated, ${notesResult.notFound} not found`);
    console.log(`Conversations: ${conversationsResult.migrated} migrated, ${conversationsResult.notFound} not found`);
    console.log(`Widget Outputs: ${widgetOutputsResult.migrated} migrated, ${widgetOutputsResult.notFound} not found`);
    console.log(`========================================\n`);
    
    return {
      success,
      notes: notesResult,
      conversations: conversationsResult,
      widgetOutputs: widgetOutputsResult,
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
    widgetOutputs: v.object({
      total: v.number(),
      convexIds: v.number(),
      legacyIds: v.number(),
    }),
  }),
  handler: async (ctx) => {
    // Helper: Check if ID is a Convex ID (starts with 'g' or 'j' or 'k' followed by alphanumeric)
    // Legacy IDs use formats like "widget1", "roman_timeline", "wdgt-xxx"
    const isConvexId = (id: string) => {
      // Convex IDs are base32-encoded and start with a table prefix
      // They're typically 32+ chars and contain only lowercase alphanumeric
      return id.length >= 32 && /^[a-z0-9]+$/.test(id) && !id.includes('_') && !id.includes('-');
    };
    
    // Check notes
    const allNotes = await ctx.db.query("notes").collect();
    const notesWithWidgetId = allNotes.filter(n => n.widgetId);
    const notesWithConvexId = notesWithWidgetId.filter(n => 
      typeof n.widgetId === 'string' && isConvexId(n.widgetId)
    );
    const notesWithLegacyId = notesWithWidgetId.filter(n =>
      typeof n.widgetId === 'string' && !isConvexId(n.widgetId)
    );
    
    // Check conversations
    const allConversations = await ctx.db.query("conversations").collect();
    const conversationsWithWidgetId = allConversations.filter(c => c.widgetId);
    const conversationsWithConvexId = conversationsWithWidgetId.filter(c =>
      typeof c.widgetId === 'string' && isConvexId(c.widgetId)
    );
    const conversationsWithLegacyId = conversationsWithWidgetId.filter(c =>
      typeof c.widgetId === 'string' && !isConvexId(c.widgetId)
    );
    
    // Check widget outputs
    const allWidgetOutputs = await ctx.db.query("widget_outputs").collect();
    const outputsWithConvexId = allWidgetOutputs.filter(o =>
      typeof o.widgetId === 'string' && isConvexId(o.widgetId)
    );
    const outputsWithLegacyId = allWidgetOutputs.filter(o =>
      typeof o.widgetId === 'string' && !isConvexId(o.widgetId)
    );
    
    const totalLegacy = notesWithLegacyId.length + conversationsWithLegacyId.length + outputsWithLegacyId.length;
    const success = totalLegacy === 0;
    
    let summary = "";
    if (success) {
      summary = `✅ Migration successful! All widget references use Convex IDs.`;
    } else {
      summary = `⚠️ Migration incomplete! ${totalLegacy} documents still have legacy IDs.`;
    }
    
    return {
      success,
      summary,
      notes: {
        total: allNotes.length,
        withWidgetId: notesWithWidgetId.length,
        convexIds: notesWithConvexId.length,
        legacyIds: notesWithLegacyId.length,
      },
      conversations: {
        total: allConversations.length,
        withWidgetId: conversationsWithWidgetId.length,
        convexIds: conversationsWithConvexId.length,
        legacyIds: conversationsWithLegacyId.length,
      },
      widgetOutputs: {
        total: allWidgetOutputs.length,
        convexIds: outputsWithConvexId.length,
        legacyIds: outputsWithLegacyId.length,
      },
    };
  },
});

