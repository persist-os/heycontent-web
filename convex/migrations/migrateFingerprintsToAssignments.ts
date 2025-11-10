/**
 * Fingerprint Migration Script
 * 
 * Migrates projects, widgets, and project_widgets to use assignment fingerprints.
 * Simple value updates - fingerprintId field can hold assignment fingerprint IDs.
 * Safe, incremental migration with verification and rollback capability.
 * 
 * USAGE - SIMPLIFIED:
 * Just run `runFullMigration()` from the Convex dashboard and it handles everything!
 * 
 * Advanced:
 * - Monitor progress: getMigrationStatus()
 * - Run migration only: autoMigrateContinuous()
 * - Run verification only: autoVerifyContinuous()
 * - Rollback a project: rollbackProject(projectId)
 */

import { internalMutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// Configuration
const DEFAULT_BATCH_SIZE = 50; // Process 50 projects at a time
const MAX_BATCHES_PER_RUN = 100; // Prevent infinite loops
const RETRY_FAILED_MIGRATIONS = true;

/**
 * 🚀 ONE-COMMAND FULL MIGRATION
 * Run this to migrate and verify all projects automatically.
 * Handles batching, retries, verification, and progress tracking.
 */
export const runFullMigration = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const batchSize = args.batchSize || DEFAULT_BATCH_SIZE;
    
    console.log("🚀 Starting fingerprint migration process...");
    
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
 * Automatically processes all unmigrated projects in batches.
 * Stops when all projects are migrated.
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
 * Automatically verifies all migrated projects in batches.
 * Stops when all projects are verified.
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
    // Get projects needing migration
    const allProjects = await ctx.db.query("projects").collect();
    const unmigrated = await filterProjectsNeedingMigration(ctx, allProjects);
    
    if (unmigrated.length === 0) {
      console.log("✅ All projects migrated!");
      break;
    }
    
    console.log(`📦 Batch ${batchCount + 1}: Processing ${Math.min(batchSize, unmigrated.length)} of ${unmigrated.length} remaining...`);
    
    // Process one batch
    const projects = unmigrated.slice(0, batchSize);
    let batchSuccess = 0;
    let batchFailed = 0;
    
    for (const project of projects) {
      try {
        await migrateProject(ctx, project);
        batchSuccess++;
        totalMigrated++;
      } catch (error: any) {
        batchFailed++;
        totalFailed++;
        const errorMsg = `${project._id}: ${error.message}`;
        allErrors.push(errorMsg);
        console.error(`❌ Failed to migrate project ${errorMsg}`);
      }
    }
    
    console.log(`✅ Batch ${batchCount + 1} complete: ${batchSuccess} succeeded, ${batchFailed} failed`);
    batchCount++;
    
    // If we failed all in this batch and retries are disabled, stop
    if (batchFailed === projects.length && !RETRY_FAILED_MIGRATIONS) {
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
  const verifiedProjectIds = new Set<string>();
  
  while (batchCount < MAX_BATCHES_PER_RUN) {
    // Get projects that have fingerprintId (migrated) for verification
    const allProjects = await ctx.db.query("projects").collect();
    const migrated = allProjects.filter(p => {
      // Consider migrated if has fingerprintId and not yet verified in this run
      return !!p.fingerprintId && !verifiedProjectIds.has(p._id);
    });
    
    if (migrated.length === 0) {
      console.log("✅ All projects verified!");
      break;
    }
    
    console.log(`🔍 Verification batch ${batchCount + 1}: Checking ${Math.min(batchSize, migrated.length)} of ${migrated.length} remaining...`);
    
    // Process one batch
    const projects = migrated.slice(0, batchSize);
    let batchSuccess = 0;
    let batchFailed = 0;
    
    for (const project of projects) {
      try {
        const isValid = await verifyProject(ctx, project);
        
        if (isValid) {
          verifiedProjectIds.add(project._id);
          batchSuccess++;
          totalVerified++;
        } else {
          // Re-migrate if verification fails
          await migrateProject(ctx, project);
          verifiedProjectIds.add(project._id); // Mark as processed
          batchFailed++;
          totalFailed++;
          allErrors.push(`${project._id}: Data mismatch detected, re-migrated`);
        }
      } catch (error: any) {
        verifiedProjectIds.add(project._id); // Mark as processed even on error
        batchFailed++;
        totalFailed++;
        const errorMsg = `${project._id}: ${error.message}`;
        allErrors.push(errorMsg);
        console.error(`❌ Failed to verify project ${errorMsg}`);
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
  const allProjects = await ctx.db.query("projects").collect();
  
  const total = allProjects.length;
  const unmigrated = await filterProjectsNeedingMigration(ctx, allProjects);
  const pending = unmigrated.length;
  const migrated = total - pending;
  
  // For status query, we just count projects with fingerprintId as migrated
  // Actual verification happens in runAutoVerification
  // Count projects with valid-looking fingerprintId (quick check, not full verification)
  let verified = 0;
  const migratedProjects = allProjects.filter(p => !!p.fingerprintId);
  for (const project of migratedProjects.slice(0, 100)) { // Sample first 100 for performance
    try {
      const fingerprint = await ctx.db.get(project.fingerprintId);
      if (fingerprint && fingerprint.projectId === project._id) {
        verified++;
      }
    } catch (error) {
      // Skip if error
    }
  }
  
  // Estimate verified count (for performance, don't check all)
  const verifiedEstimate = migratedProjects.length > 0 
    ? Math.round((verified / Math.min(migratedProjects.length, 100)) * migratedProjects.length)
    : 0;
  const unverified = migrated - verifiedEstimate;
  
  // Sample projects in each state
  const sampleUnmigrated = unmigrated
    .slice(0, 3)
    .map(p => ({ id: p._id, name: p.name, fingerprintId: p.fingerprintId }));
    
  // Sample projects with fingerprintId for unverified check
  const sampleUnverified = migratedProjects
    .slice(0, 3)
    .map(p => ({ id: p._id, name: p.name, fingerprintId: p.fingerprintId }));
  
  return {
    total,
    migrated,
    verified: verifiedEstimate,
    pending,
    unverified,
    progress_percent: total > 0 ? Math.round((migrated / total) * 100) : 100,
    verified_percent: migrated > 0 ? Math.round((verifiedEstimate / migrated) * 100) : 100,
    is_complete: pending === 0,
    sampleUnmigrated,
    sampleUnverified,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Filter projects that need migration
 * Projects need migration if:
 * - fingerprintId is undefined
 * - fingerprintId doesn't point to valid assignment_fingerprint for this project
 */
async function filterProjectsNeedingMigration(ctx: any, projects: any[]): Promise<any[]> {
  const needsMigration: any[] = [];
  
  for (const project of projects) {
    // Need migration if fingerprintId is undefined
    if (!project.fingerprintId) {
      needsMigration.push(project);
      continue;
    }
    
    // Check if assignment_fingerprint exists for this project (authoritative check)
    const assignmentFingerprint = await ctx.db
      .query("assignment_fingerprints")
      .withIndex("by_project_user", (q) => 
        q.eq("projectId", project._id).eq("userId", project.userId)
      )
      .first();
    
    if (!assignmentFingerprint) {
      // No assignment fingerprint exists for this project
      needsMigration.push(project);
      continue;
    }
    
    // Check if project.fingerprintId points to the correct assignment fingerprint
    if (project.fingerprintId !== assignmentFingerprint._id) {
      // fingerprintId points to wrong fingerprint (or invalid record)
      needsMigration.push(project);
      continue;
    }
    
    // Valid assignment fingerprint exists and project.fingerprintId is correct
    // Project is already migrated - skip
  }
  
  return needsMigration;
}

/**
 * Migrate a single project
 * Creates assignment fingerprint if needed and updates all fingerprintId references
 */
async function migrateProject(ctx: any, project: any) {
  // 1. Check if assignment fingerprint already exists
  let assignmentFingerprint = await ctx.db
    .query("assignment_fingerprints")
    .withIndex("by_project_user", (q) => 
      q.eq("projectId", project._id).eq("userId", project.userId)
    )
    .first();
  
  // 2. Create if doesn't exist
  if (!assignmentFingerprint) {
    const fingerprintId = await ctx.runMutation(
      api.assignmentFingerprintMutations.mutateAssignmentFingerprint,
      {
        operation: "create",
        projectId: project._id,
        userId: project.userId,
        createData: {
          insights: [],
          currentGoals: [],
          currentConstraints: [],
          version: 1,
          totalInsights: 0,
        }
      }
    );
    
    assignmentFingerprint = await ctx.db.get(fingerprintId);
    if (!assignmentFingerprint) {
      throw new Error("Failed to create assignment fingerprint");
    }
  }
  
  // 3. Update project.fingerprintId
  await ctx.db.patch(project._id, {
    fingerprintId: assignmentFingerprint._id,
    updatedAt: Date.now(),
  });
  
  // 4. Update widgets.fingerprintId
  const widgets = await ctx.db
    .query("widgets")
    .withIndex("by_project", (q) => q.eq("projectId", project._id))
    .collect();
  
  for (const widget of widgets) {
    await ctx.db.patch(widget._id, {
      fingerprintId: assignmentFingerprint._id,
      updatedAt: Date.now(),
    });
  }
  
  // 5. Update project_widgets.fingerprintId
  const projectWidgets = await ctx.db
    .query("project_widgets")
    .withIndex("by_project", (q) => q.eq("projectId", project._id))
    .collect();
  
  for (const layout of projectWidgets) {
    await ctx.db.patch(layout._id, {
      fingerprintId: assignmentFingerprint._id,
      updatedAt: Date.now(),
    });
  }
  
  console.log(
    `[MIGRATION] Migrated project ${project._id}: ${widgets.length} widgets, ${projectWidgets.length} layouts`
  );
}

/**
 * Verify a single project's migration
 * Checks that:
 * - Project has valid assignment fingerprint
 * - All widgets reference correct fingerprint
 * - All project_widgets reference correct fingerprint
 */
async function verifyProject(ctx: any, project: any): Promise<boolean> {
  // 1. Check project has fingerprintId
  if (!project.fingerprintId) {
    console.error(`[VERIFY] Project ${project._id} has no fingerprintId`);
    return false;
  }
  
  // 2. Check assignment fingerprint exists for this project (authoritative check)
  const assignmentFingerprint = await ctx.db
    .query("assignment_fingerprints")
    .withIndex("by_project_user", (q) => 
      q.eq("projectId", project._id).eq("userId", project.userId)
    )
    .first();
  
  if (!assignmentFingerprint) {
    console.error(`[VERIFY] Project ${project._id} has no assignment fingerprint`);
    return false;
  }
  
  // 3. Check project.fingerprintId points to the correct assignment fingerprint
  if (project.fingerprintId !== assignmentFingerprint._id) {
    console.error(
      `[VERIFY] Project ${project._id} fingerprintId ${project.fingerprintId} doesn't match assignment fingerprint ${assignmentFingerprint._id}`
    );
    return false;
  }
  
  // 4. Verify all widgets reference correct fingerprint
  const widgets = await ctx.db
    .query("widgets")
    .withIndex("by_project", (q) => q.eq("projectId", project._id))
    .collect();
  
  for (const widget of widgets) {
    if (widget.fingerprintId !== assignmentFingerprint._id) {
      console.error(
        `[VERIFY] Widget ${widget._id} has fingerprintId ${widget.fingerprintId}, expected ${assignmentFingerprint._id}`
      );
      return false;
    }
  }
  
  // 5. Verify all project_widgets reference correct fingerprint
  const projectWidgets = await ctx.db
    .query("project_widgets")
    .withIndex("by_project", (q) => q.eq("projectId", project._id))
    .collect();
  
  for (const layout of projectWidgets) {
    if (layout.fingerprintId !== assignmentFingerprint._id) {
      console.error(
        `[VERIFY] ProjectWidgets ${layout._id} has fingerprintId ${layout.fingerprintId}, expected ${assignmentFingerprint._id}`
      );
      return false;
    }
  }
  
  return true;
}

/**
 * Rollback a single project migration (emergency use only)
 * Resets fingerprintId to undefined (doesn't delete assignment fingerprints)
 */
export const rollbackProject = internalMutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Reset fingerprintId to undefined
    await ctx.db.patch(args.projectId, {
      fingerprintId: undefined,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      projectId: args.projectId,
    };
  },
});

