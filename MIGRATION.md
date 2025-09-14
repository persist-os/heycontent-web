# Database Migration Guide

This document describes the database cleanup migration for HeyContent.

## Quick Start

**TL;DR - Run these commands in order:**

```bash
# 1. Deploy migration functions
npx convex deploy

# 2. Check what needs to be cleaned
npx convex run migrations:getMigrationStatus

# 3. See what would be changed (safe - no actual changes)
npx convex run migrations:runFullMigration '{"dryRun": true}'

# 4. Run the actual migration (⚠️ permanent changes!)
npx convex run migrations:runFullMigration '{"dryRun": false}'
```

## Migration Overview

This migration performs the following cleanup operations:

1. **Clear contentEmbeddings table** - Removes all vector embeddings data
2. **Clear embeddingUpdates table** - Removes all embedding update tracking records
3. **Remove social media fields from projects table**:
   - `gmailIds`
   - `instagramPostIds` 
   - `youtubeVideoIds`
4. **Remove lastGmailFetch field from users table**

## Running the Migration

⚠️ **IMPORTANT**: Before running any migration commands, you must deploy the migration functions to Convex.

### Step 1: Deploy Migration Functions

First, deploy the migration functions to your Convex deployment:

```bash
npx convex deploy
```

This will:
- Deploy the new migration functions to Convex
- Make them available for execution
- Update your Convex deployment with the latest code

### Step 2: Check Current Status

Check what needs to be cleaned up:

```bash
npx convex run migrations:getMigrationStatus
```

This will show you the current state of your database:

**Example output:**
```
{
  contentEmbeddingsCount: 0,
  embeddingUpdatesCount: 642,
  projectsWithSocialMediaFields: 0,
  usersWithLastGmailFetch: 11
}
```

### Step 3: Run Dry Run (Recommended)

**Always run a dry run first** to see what would be changed:

```bash
npx convex run migrations:runFullMigration '{"dryRun": true}'
```

This will:
- Show you exactly what would be changed
- **NOT make any actual changes** to the database
- Give you confidence before running the real migration

**Example output:**
```
[CONVEX] [LOG] 'Starting full migration (dryRun: true, batchSize: 100)'
[CONVEX] [LOG] 'Starting contentEmbeddings cleanup (dryRun: true, batchSize: 100)'
[CONVEX] [LOG] 'Completed contentEmbeddings cleanup. Total processed: 0, Deleted: 0'
[CONVEX] [LOG] 'Starting embeddingUpdates cleanup (dryRun: true, batchSize: 100)'
[CONVEX] [LOG] 'Processed 100 embeddingUpdates documents (dry run)'
[CONVEX] [LOG] 'Processed 200 embeddingUpdates documents (dry run)'
...
[CONVEX] [LOG] 'Completed embeddingUpdates cleanup. Total processed: 642, Deleted: 0'
[CONVEX] [LOG] 'Starting users lastGmailFetch field cleanup (dryRun: true, batchSize: 100)'
[CONVEX] [LOG] 'Processed 33 users documents, updated 11 (dry run)'
[CONVEX] [LOG] 'Full migration completed (dry run)'

{
  contentEmbeddingsResult: { completed: true, deletedCount: 0, totalProcessed: 0 },
  embeddingUpdatesResult: { completed: true, deletedCount: 0, totalProcessed: 642 },
  migrationCompleted: true,
  projectsResult: { completed: true, totalProcessed: 0, updatedCount: 0 },
  usersResult: { completed: true, totalProcessed: 33, updatedCount: 11 }
}
```

### Step 4: Run Actual Migration

Once you're satisfied with the dry run results:

```bash
npx convex run migrations:runFullMigration '{"dryRun": false}'
```

⚠️ **Warning**: This will make **permanent changes** to your database!

**Example output:**
```
[CONVEX] [LOG] 'Starting full migration (dryRun: false, batchSize: 100)'
[CONVEX] [LOG] 'Starting contentEmbeddings cleanup (dryRun: false, batchSize: 100)'
[CONVEX] [LOG] 'Completed contentEmbeddings cleanup. Total processed: 0, Deleted: 0'
[CONVEX] [LOG] 'Starting embeddingUpdates cleanup (dryRun: false, batchSize: 100)'
[CONVEX] [LOG] 'Processed 100 embeddingUpdates documents'
[CONVEX] [LOG] 'Processed 200 embeddingUpdates documents'
...
[CONVEX] [LOG] 'Completed embeddingUpdates cleanup. Total processed: 642, Deleted: 642'
[CONVEX] [LOG] 'Starting users lastGmailFetch field cleanup (dryRun: false, batchSize: 100)'
[CONVEX] [LOG] 'Processed 33 users documents, updated 11'
[CONVEX] [LOG] 'Full migration completed'

{
  contentEmbeddingsResult: { completed: true, deletedCount: 0, totalProcessed: 0 },
  embeddingUpdatesResult: { completed: true, deletedCount: 642, totalProcessed: 642 },
  migrationCompleted: true,
  projectsResult: { completed: true, totalProcessed: 0, updatedCount: 0 },
  usersResult: { completed: true, totalProcessed: 33, updatedCount: 11 }
}
```

### Step 5: Verify Migration

Verify the migration was successful:

```bash
npx convex run migrations:getMigrationStatus
```

**Expected output after successful migration:**
```
{
  contentEmbeddingsCount: 0,
  embeddingUpdatesCount: 0,
  projectsWithSocialMediaFields: 0,
  usersWithLastGmailFetch: 0
}
```

## Migration Features

### Safety Features
- **Dry run by default** - Always shows what would happen before making changes
- **Batch processing** - Processes data in small batches to avoid timeouts
- **Progress logging** - Shows detailed progress during execution
- **Status checking** - Verify results before and after migration

### Batch Processing
- Default batch size: 100 documents per batch
- Prevents memory issues and timeouts
- Provides regular progress updates

### Error Handling
- Migration stops if any batch fails
- Clear error messages for troubleshooting
- No partial state - either all succeeds or all fails

## Manual Migration (Advanced)

If you need to run individual migration steps, you can use the Convex CLI directly:

### Check status
```bash
npx convex run migrations:getMigrationStatus
```

### Run individual migrations
```bash
# Clear contentEmbeddings (dry run)
npx convex run migrations:clearContentEmbeddings '{"dryRun": true}'

# Clear contentEmbeddings (actual)
npx convex run migrations:clearContentEmbeddings '{"dryRun": false}'

# Clear embeddingUpdates (dry run)
npx convex run migrations:clearEmbeddingUpdates '{"dryRun": true}'

# Clear embeddingUpdates (actual)
npx convex run migrations:clearEmbeddingUpdates '{"dryRun": false}'

# Clean projects social media fields (dry run)
npx convex run migrations:cleanupProjectsSocialMediaFields '{"dryRun": true}'

# Clean projects social media fields (actual)
npx convex run migrations:cleanupProjectsSocialMediaFields '{"dryRun": false}'

# Clean users lastGmailFetch field (dry run)
npx convex run migrations:cleanupUsersLastGmailFetch '{"dryRun": true}'

# Clean users lastGmailFetch field (actual)
npx convex run migrations:cleanupUsersLastGmailFetch '{"dryRun": false}'
```

### Run full migration
```bash
# Full migration (dry run)
npx convex run migrations:runFullMigration '{"dryRun": true}'

# Full migration (actual)
npx convex run migrations:runFullMigration '{"dryRun": false}'
```

## Expected Results

After successful migration:
- `contentEmbeddings` table: 0 documents
- `embeddingUpdates` table: 0 documents
- `projects` table: No documents with `gmailIds`, `instagramPostIds`, or `youtubeVideoIds` fields
- `users` table: No documents with `lastGmailFetch` field

## Rollback

⚠️ **Warning**: This migration is destructive and cannot be rolled back. The deleted data cannot be recovered.

Make sure you have a database backup if you need to preserve any of the data being removed.

## Troubleshooting

### "Could not find function" error
If you get an error like `Could not find function for 'migrations:getMigrationStatus'`:

1. **Deploy the migration functions first**:
   ```bash
   npx convex deploy
   ```

2. **Check if you're authenticated**:
   ```bash
   npx convex auth
   ```

3. **Verify your deployment**:
   ```bash
   npx convex env
   ```

### Migration issues
All commands use the Convex CLI directly for maximum reliability:

**Commands that work:**
```bash
# Check status
npx convex run migrations:getMigrationStatus

# Run dry run
npx convex run migrations:runFullMigration '{"dryRun": true}'

# Run actual migration
npx convex run migrations:runFullMigration '{"dryRun": false}'
```

### Migration fails with timeout
- The migration uses batch processing to avoid timeouts
- If you still get timeouts, try reducing the batch size:
  ```bash
  npx convex run migrations:runFullMigration '{"batchSize": 50, "dryRun": false}'
  ```

### Migration shows 0 changes needed
- Run status check to confirm there's nothing to migrate
- The migration may have already been completed

### Permission errors
- Ensure you're authenticated with Convex: `npx convex auth`
- Make sure you have the correct deployment selected: `npx convex env`

### Best practices
- Always run the dry run first to verify what will be changed
- The Convex CLI commands are the most reliable way to run migrations
- Use the individual migration functions if you need granular control

## Files Changed

The following files were added/modified for this migration:

- `convex/migrations.ts` - Migration functions
- `scripts/run-migration.cjs` - Migration runner script  
- `package.json` - Added migration npm scripts
- `MIGRATION.md` - This documentation
