# Conversation Message Migration

Automated migration system to move messages from `conversations.messages[]` array to individual `messages` table entries.

## 🚀 Quick Start

### Option 1: CLI (Recommended)

```bash
# Run the full migration
npx convex run migrations/runMigration:runMigration

# Check status only
npx convex run migrations/runMigration:checkStatus
```

### Option 2: Convex Dashboard

1. Open your Convex dashboard
2. Go to Functions
3. Run: `migrations/migrateConversationMessages:runFullMigration`
4. Click "Run" (no arguments needed)

That's it! The system automatically handles:
- ✅ Batch processing
- ✅ Progress tracking
- ✅ Automatic verification
- ✅ Error handling
- ✅ Retry logic

## 📊 Monitoring Progress

### From CLI:
```bash
npx convex run migrations/runMigration:checkStatus
```

### From Dashboard:
Run the query: `migrations/migrateConversationMessages:getMigrationStatus`

### Output Example:
```
📊 Migration Status:
  Total conversations: 1250
  Migrated: 1250 (100%)
  Verified: 1250 (100%)
  Pending migration: 0
  Pending verification: 0
  Complete: ✅ Yes
```

## ⚙️ Configuration

Edit the constants in `migrateConversationMessages.ts`:

```typescript
const DEFAULT_BATCH_SIZE = 50;           // Process 50 conversations at a time
const MAX_BATCHES_PER_RUN = 100;        // Max 100 batches per execution
const RETRY_FAILED_MIGRATIONS = true;    // Retry failed migrations
```

### Custom Batch Size

```bash
# CLI
npx convex run migrations/runMigration:runMigration '{"batchSize": 100}'

# Dashboard
runFullMigration({ batchSize: 100 })
```

## 🔧 Advanced Usage

### Migrate Only (No Verification)
```typescript
// Dashboard
autoMigrateContinuous()
```

### Verify Only
```typescript
// Dashboard
autoVerifyContinuous()
```

### Manual Batching (Legacy)
```typescript
// Process 25 conversations
migrateBatch({ batchSize: 25 })

// Verify 25 conversations
verifyBatch({ batchSize: 25 })
```

### Rollback a Conversation
```typescript
// Emergency use only!
rollbackConversation({ conversationId: "j5..." })
```

## 🏗️ Architecture

### Data Flow
```
conversations.messages[] → messages table
     ↓
  [Migration]
     ↓
  conversations.migrated = true
  conversations.migrationVerified = false
     ↓
  [Verification]
     ↓
  conversations.migrationVerified = true
```

### New Fields Added to `conversations`
- `migrated: boolean` - Has this conversation been migrated?
- `migrationVerified: boolean` - Has migration been verified?
- `messageCount: number` - Cached count of messages (updated)
- `lastMessageAt: number` - Timestamp of last message (updated)

### New `messages` Table
Each message is stored individually with:
- `conversationId` - Link to parent conversation
- `userId` - Message author
- `content` - Message text
- `role` - "user" or "assistant"
- `sequence` - Order in conversation (0, 1, 2...)
- `timestamp` - When message was sent
- `context` - Optional context data
- `fileAttachments` - Optional file attachments
- `enrichment_metadata` - Optional enrichment data

## 🔒 Safety Features

### 1. Idempotent
- Safe to run multiple times
- Won't duplicate data
- Skips already-migrated conversations

### 2. Verification
- Automatically verifies data integrity
- Checks message count matches
- Validates content, role, and sequence
- Flags mismatches for manual review

### 3. Rollback
- Emergency rollback available per conversation
- Deletes migrated messages
- Resets migration flags
- Restores original state

### 4. Error Handling
- Catches and logs individual conversation errors
- Continues processing other conversations
- Returns detailed error reports
- Configurable retry behavior

### 5. Performance
- Processes in batches to avoid timeouts
- Configurable batch sizes
- Progress tracking
- Automatic continuation

## 📈 Performance Expectations

Approximate processing times:

| Conversations | Messages Each | Total Messages | Time (50/batch) |
|--------------|---------------|----------------|-----------------|
| 100          | 10            | 1,000          | ~10 seconds     |
| 1,000        | 10            | 10,000         | ~2 minutes      |
| 10,000       | 10            | 100,000        | ~20 minutes     |
| 100,000      | 10            | 1,000,000      | ~3-4 hours      |

*Times are estimates and vary based on message complexity and system load.*

### For Large Datasets
If you have >50,000 conversations:
1. Increase batch size: `{ batchSize: 100 }`
2. Run during off-peak hours
3. Monitor progress with `checkStatus`
4. May need to run multiple times if hitting MAX_BATCHES_PER_RUN limit

## 🐛 Troubleshooting

### Migration Stuck?
```bash
# Check current status
npx convex run migrations/runMigration:checkStatus

# If showing pending items but not progressing, check errors
# Run migration again - it's safe to retry
npx convex run migrations/runMigration:runMigration
```

### Verification Failures?
Check the error output for specific conversation IDs, then:
```typescript
// Inspect the conversation
// In dashboard, get the conversation and compare messages[]
// with the migrated messages table entries

// If data is corrupted, rollback and re-migrate
rollbackConversation({ conversationId: "failed_id" })
// Then run migration again
```

### Timeout Errors?
- Reduce batch size: `{ batchSize: 25 }`
- Run during off-peak hours
- Increase MAX_BATCHES_PER_RUN if needed

## 📝 Migration Checklist

- [ ] Back up your database (export important conversations)
- [ ] Deploy schema changes (deploy to Convex)
- [ ] Run migration: `npx convex run migrations/runMigration:runMigration`
- [ ] Verify completion: `npx convex run migrations/runMigration:checkStatus`
- [ ] Check application functionality with new messages table
- [ ] Monitor for a few days
- [ ] (Optional) Remove legacy `messages` array field from schema
- [ ] (Optional) Remove migration tracking fields (`migrated`, `migrationVerified`)

## 🔍 API Reference

### Mutations

#### `runFullMigration(args?)`
Main migration function. Runs migration + verification.
- Args: `{ batchSize?: number }` (optional)
- Returns: Full migration report with status

#### `autoMigrateContinuous(args?)`
Migrates all unmigrated conversations automatically.
- Args: `{ batchSize?: number }` (optional)
- Returns: Migration results

#### `autoVerifyContinuous(args?)`
Verifies all unverified conversations automatically.
- Args: `{ batchSize?: number }` (optional)
- Returns: Verification results

#### `migrateBatch(args)`
Legacy manual batch migration.
- Args: `{ batchSize: number }` (required)
- Returns: Batch results

#### `verifyBatch(args)`
Legacy manual batch verification.
- Args: `{ batchSize: number }` (required)
- Returns: Verification results

#### `rollbackConversation(args)`
Emergency rollback for a single conversation.
- Args: `{ conversationId: Id<"conversations"> }` (required)
- Returns: Success status

### Queries

#### `getMigrationStatus()`
Get current migration progress (non-mutating).
- Args: None
- Returns: Status object with counts and percentages

## 📚 Related Documentation

- [CHATGPT_IMPORT_PLAN.md](../../CHATGPT_IMPORT_PLAN.md)
- [feature/CONVERSATION_MESSAGES_MIGRATION_AUDIT.md](../../.cursor/feature/CONVERSATION_MESSAGES_MIGRATION_AUDIT.md)
- Schema: `convex/schema.ts`

## 🆘 Support

If you encounter issues:
1. Check the Convex dashboard logs
2. Run `checkStatus` to see current state
3. Review error messages in migration results
4. Check that schema is deployed correctly
5. Verify indexes are created

## ✅ Post-Migration

After successful migration:
1. Application should work with both old and new message storage
2. New messages go directly to `messages` table
3. Old messages remain in `conversations.messages[]` for safety
4. Can safely remove old `messages[]` field after verification period
5. Migration tracking fields can be removed after all is stable
