import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * MIGRATION SCRIPT: Migrate widgets from array to individual documents
 * 
 * This script migrates legacy project_widgets documents that store widgets
 * as an array to the new format where each widget is its own document.
 * 
 * Usage:
 * 1. Deploy this file
 * 2. Call checkMigrationStatus to see how many need migration
 * 3. Call runMigration to migrate all legacy documents
 * 4. Call verifyMigration to confirm success
 * 5. After verification, remove the optional `widgets` field from schema
 */

// ============================================================================
// CHECK MIGRATION STATUS
// ============================================================================

/**
 * Check how many project_widgets documents need migration
 */
export const checkMigrationStatus = internalQuery({
  args: {},
  returns: v.object({
    total: v.number(),
    needsMigration: v.number(),
    alreadyMigrated: v.number(),
    documentsToMigrate: v.array(v.object({
      _id: v.id("project_widgets"),
      projectId: v.id("projects"),
      userId: v.string(),
      widgetCount: v.number(),
    })),
  }),
  handler: async (ctx) => {
    const allProjectWidgets = await ctx.db
      .query("project_widgets")
      .collect();

    const needsMigration = allProjectWidgets.filter(
      (pw) => pw.widgets && pw.widgets.length > 0
    );

    const alreadyMigrated = allProjectWidgets.filter(
      (pw) => !pw.widgets || pw.widgets.length === 0
    );

    return {
      total: allProjectWidgets.length,
      needsMigration: needsMigration.length,
      alreadyMigrated: alreadyMigrated.length,
      documentsToMigrate: needsMigration.map((pw) => ({
        _id: pw._id,
        projectId: pw.projectId,
        userId: pw.userId,
        widgetCount: pw.widgets?.length || 0,
      })),
    };
  },
});

// ============================================================================
// RUN MIGRATION
// ============================================================================

/**
 * Migrate all legacy project_widgets documents to new format
 * Safe to run multiple times - idempotent
 */
export const runMigration = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()), // If true, don't actually migrate
    batchSize: v.optional(v.number()), // Migrate this many at once
  },
  returns: v.object({
    success: v.boolean(),
    migratedCount: v.number(),
    widgetsCreated: v.number(),
    errors: v.array(v.string()),
    dryRun: v.boolean(),
  }),
  handler: async (ctx, { dryRun = false, batchSize = 100 }) => {
    console.log(`🚀 Starting migration (dryRun=${dryRun})`);

    const projectWidgets = await ctx.db
      .query("project_widgets")
      .take(batchSize);

    const toMigrate = projectWidgets.filter(
      (pw) => pw.widgets && pw.widgets.length > 0
    );

    console.log(`📊 Found ${toMigrate.length} documents to migrate`);

    let migratedCount = 0;
    let widgetsCreated = 0;
    const errors: string[] = [];

    for (const projectWidget of toMigrate) {
      try {
        console.log(
          `\n📦 Migrating project ${projectWidget.projectId} (${projectWidget.widgets!.length} widgets)`
        );

        if (!dryRun) {
          // Create individual widget documents
          const now = Date.now();

          for (const widget of projectWidget.widgets!) {
            // Check if widget already exists (avoid duplicates)
            const existing = await ctx.db
              .query("widgets")
              .withIndex("by_widget_id", (q) =>
                q
                  .eq("projectId", projectWidget.projectId)
                  .eq("widget_id", widget.widget_id)
              )
              .first();

            if (existing) {
              console.log(
                `  ⚠️  Widget ${widget.widget_id} already exists, skipping`
              );
              continue;
            }

            await ctx.db.insert("widgets", {
              projectId: projectWidget.projectId,
              fingerprintId: projectWidget.fingerprintId,
              userId: projectWidget.userId,
              widget_id: widget.widget_id,
              widget_type: widget.widget_type,
              title: widget.title,
              description: widget.description,
              category: widget.category,
              priority: widget.priority,
              size: widget.size,
              theme: widget.theme,
              position: widget.position,
              config: widget.config,
              data_sources: widget.data_sources,
              update_frequency: widget.update_frequency,
              interactive: widget.interactive,
              editable: widget.editable,
              shareable: widget.shareable,
              lastRunAt: widget.lastRunAt,
              lastRunStatus: widget.lastRunStatus,
              status: "active",
              createdAt: projectWidget.createdAt || now,
              updatedAt: projectWidget.updatedAt || now,
            });

            widgetsCreated++;
            console.log(`  ✅ Created widget: ${widget.title}`);
          }

          // Remove the widgets array from project_widgets document
          await ctx.db.patch(projectWidget._id, {
            widgets: undefined,
          });

          console.log(
            `✅ Migrated project ${projectWidget.projectId} - ${projectWidget.widgets!.length} widgets created`
          );
        } else {
          console.log(
            `  [DRY RUN] Would create ${projectWidget.widgets!.length} widgets`
          );
          widgetsCreated += projectWidget.widgets!.length;
        }

        migratedCount++;
      } catch (error: any) {
        const errorMsg = `Failed to migrate ${projectWidget._id}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`  📊 Migrated: ${migratedCount} documents`);
    console.log(`  🎯 Widgets created: ${widgetsCreated}`);
    console.log(`  ❌ Errors: ${errors.length}`);

    return {
      success: errors.length === 0,
      migratedCount,
      widgetsCreated,
      errors,
      dryRun,
    };
  },
});

// ============================================================================
// VERIFY MIGRATION
// ============================================================================

/**
 * Verify that migration was successful
 * Checks for any remaining legacy documents
 */
export const verifyMigration = internalQuery({
  args: {},
  returns: v.object({
    success: v.boolean(),
    totalProjectWidgets: v.number(),
    legacyDocuments: v.number(),
    totalWidgets: v.number(),
    projectWidgetsWithNoWidgetDocs: v.array(v.string()),
    message: v.string(),
  }),
  handler: async (ctx) => {
    // Check for legacy documents
    const allProjectWidgets = await ctx.db
      .query("project_widgets")
      .collect();

    const legacyDocs = allProjectWidgets.filter(
      (pw) => pw.widgets && pw.widgets.length > 0
    );

    // Count total widgets
    const totalWidgets = await ctx.db.query("widgets").collect();

    // Find project_widgets without corresponding widget documents
    const projectWidgetsWithNoWidgetDocs: string[] = [];

    for (const pw of allProjectWidgets) {
      const widgets = await ctx.db
        .query("widgets")
        .withIndex("by_project", (q) => q.eq("projectId", pw.projectId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      if (widgets.length === 0) {
        projectWidgetsWithNoWidgetDocs.push(pw._id);
      }
    }

    const success = legacyDocs.length === 0;

    let message = "";
    if (success) {
      message = `✅ Migration successful! All ${allProjectWidgets.length} project_widgets documents migrated. Total ${totalWidgets.length} individual widgets created.`;
    } else {
      message = `⚠️ Migration incomplete! ${legacyDocs.length} documents still have legacy widgets array.`;
    }

    if (projectWidgetsWithNoWidgetDocs.length > 0) {
      message += ` Note: ${projectWidgetsWithNoWidgetDocs.length} project_widgets have no widget documents.`;
    }

    return {
      success,
      totalProjectWidgets: allProjectWidgets.length,
      legacyDocuments: legacyDocs.length,
      totalWidgets: totalWidgets.length,
      projectWidgetsWithNoWidgetDocs,
      message,
    };
  },
});

// ============================================================================
// CLEANUP EMPTY WIDGETS FIELD
// ============================================================================

/**
 * Remove the empty widgets field from all documents
 * Run this after verifying migration is successful
 */
export const cleanupEmptyWidgetsField = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    cleanedCount: v.number(),
    dryRun: v.boolean(),
  }),
  handler: async (ctx, { dryRun = false }) => {
    const projectWidgets = await ctx.db
      .query("project_widgets")
      .collect();

    let cleanedCount = 0;

    for (const pw of projectWidgets) {
      if (pw.widgets !== undefined) {
        if (!dryRun) {
          await ctx.db.patch(pw._id, {
            widgets: undefined,
          });
        }
        cleanedCount++;
      }
    }

    console.log(
      `${dryRun ? "[DRY RUN]" : "✅"} Cleaned ${cleanedCount} documents`
    );

    return {
      success: true,
      cleanedCount,
      dryRun,
    };
  },
});

