/**
 * CLI Script to Run Conversation Message Migration
 * 
 * This is a Convex action that can be called from the command line.
 * It runs the full migration process and displays progress.
 */

import { action } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Run the full migration process
 * 
 * Usage from terminal:
 *   npx convex run migrations/runMigration:runMigration
 * 
 * With custom batch size:
 *   npx convex run migrations/runMigration:runMigration '{"batchSize": 100}'
 */
export const runMigration = action({
  args: {},
  handler: async (ctx) => {
    console.log("🚀 Starting conversation message migration...\n");
    
    // Get initial status
    const initialStatus = await ctx.runQuery(
      internal.migrations.migrateConversationMessages.getMigrationStatus
    );
    
    console.log("📊 Initial Status:");
    console.log(`  Total conversations: ${initialStatus.total}`);
    console.log(`  Already migrated: ${initialStatus.migrated} (${initialStatus.progress_percent}%)`);
    console.log(`  Already verified: ${initialStatus.verified} (${initialStatus.verified_percent}%)`);
    console.log(`  Pending migration: ${initialStatus.pending}`);
    console.log(`  Pending verification: ${initialStatus.unverified}\n`);
    
    if (initialStatus.is_complete) {
      console.log("✅ Migration already complete! Nothing to do.");
      return { success: true, message: "Already complete" };
    }
    
    // Run the migration
    console.log("🔄 Running migration...\n");
    const result = await ctx.runMutation(
      internal.migrations.migrateConversationMessages.runFullMigration,
      {}
    );
    
    // Display results
    console.log("\n📊 Migration Results:");
    console.log(`  Success: ${result.success ? "✅ Yes" : "❌ No"}`);
    console.log(`  Duration: ${result.duration_readable}`);
    
    console.log("\n📦 Migration Phase:");
    console.log(`  Migrated: ${result.migration.totalMigrated} conversations`);
    console.log(`  Failed: ${result.migration.totalFailed}`);
    console.log(`  Batches: ${result.migration.batchesProcessed}`);
    
    console.log("\n✅ Verification Phase:");
    console.log(`  Verified: ${result.verification.totalVerified} conversations`);
    console.log(`  Failed: ${result.verification.totalFailed}`);
    console.log(`  Batches: ${result.verification.batchesProcessed}`);
    
    console.log("\n📈 Final Status:");
    console.log(`  Total: ${result.finalStatus.total}`);
    console.log(`  Migrated: ${result.finalStatus.migrated} (${result.finalStatus.progress_percent}%)`);
    console.log(`  Verified: ${result.finalStatus.verified} (${result.finalStatus.verified_percent}%)`);
    console.log(`  Pending: ${result.finalStatus.pending}`);
    console.log(`  Unverified: ${result.finalStatus.unverified}`);
    console.log(`  Complete: ${result.finalStatus.is_complete ? "✅ Yes" : "❌ No"}`);
    
    if (result.migration.errors && result.migration.errors.length > 0) {
      console.log("\n⚠️  Migration Errors (first 10):");
      result.migration.errors.forEach((err: string, i: number) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }
    
    if (result.verification.errors && result.verification.errors.length > 0) {
      console.log("\n⚠️  Verification Errors (first 10):");
      result.verification.errors.forEach((err: string, i: number) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }
    
    console.log("\n✨ Migration process complete!");
    
    return result;
  },
});

/**
 * Check migration status without running anything
 * 
 * Usage:
 *   npx convex run migrations/runMigration:checkStatus
 */
export const checkStatus = action({
  args: {},
  handler: async (ctx) => {
    const status = await ctx.runQuery(
      internal.migrations.migrateConversationMessages.getMigrationStatus
    );
    
    console.log("📊 Migration Status:");
    console.log(`  Total conversations: ${status.total}`);
    console.log(`  Migrated: ${status.migrated} (${status.progress_percent}%)`);
    console.log(`  Verified: ${status.verified} (${status.verified_percent}%)`);
    console.log(`  Pending migration: ${status.pending}`);
    console.log(`  Pending verification: ${status.unverified}`);
    console.log(`  Complete: ${status.is_complete ? "✅ Yes" : "❌ No"}`);
    
    if (status.sampleUnmigrated.length > 0) {
      console.log("\n📋 Sample unmigrated conversations:");
      status.sampleUnmigrated.forEach((conv: any) => {
        console.log(`  - ${conv.id} (${conv.messageCount} messages)`);
      });
    }
    
    if (status.sampleUnverified.length > 0) {
      console.log("\n📋 Sample unverified conversations:");
      status.sampleUnverified.forEach((conv: any) => {
        console.log(`  - ${conv.id} (${conv.messageCount} messages)`);
      });
    }
    
    return status;
  },
});
