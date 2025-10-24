# Data Imports System Migration

## Summary
Migrated from `migration_tracking` table to dedicated `data_imports` table that supports multiple import sources (ChatGPT, Claude, etc.).

## Changes Made

### 1. New Data Imports Table
**File:** `convex/types/dataImport.ts`
- Created dedicated type validators for import sources and statuses
- Schema supports `chatgpt` and `claude` import sources
- Extensible design for future import sources

**Schema fields:**
- `userId` - User performing the import
- `importSource` - Source type (`"chatgpt"` | `"claude"`)
- `completed` - Import completion status
- `completedAt` - Completion timestamp
- `attempts` - Number of import attempts
- `lastAttemptAt` - Last attempt timestamp
- `status` - Current status (`"queued"` | `"running"` | `"completed"` | `"failed"` | `"cancelled"`)
- `progress` - Progress message
- `error` - Error message if failed
- `jobId` - Associated background job ID
- `progressDetails` - Detailed progress information
- `contentProcessed` - Summary of imported content

### 2. Updated Schema
**File:** `convex/schema.ts`
- Added `data_imports` table with indexes:
  - `by_user_source` - Query imports by user and source (primary access pattern)
  - `by_user` - Query all user imports
  - `by_status` - Query imports by status
  - `by_job_id` - Query by background job ID

### 3. Refactored ChatGPT Import
**File:** `convex/chatgptImport.ts`
- Removed all `migration_tracking` references
- Updated to use `data_imports` table with `importSource: "chatgpt"`
- Simplified and cleaned up code
- All functions now query/mutate the new table

### 4. Added Claude Import Support
**File:** `convex/claudeImport.ts`
- New file demonstrating extensibility
- Follows same pattern as `chatgptImport.ts`
- Uses `importSource: "claude"`
- Ready for implementation when Claude import is needed

### 5. Frontend Update
**File:** `src/app/dashboard/import/chatgpt/useChatGPTImport.ts`
- Updated comment to reference `data_imports` instead of `migration_tracking`
- All API calls automatically use new table (no code changes needed)

## Benefits

1. **Dedicated Purpose**: Separate table specifically for data imports, not mixed with general migrations
2. **Multi-Source Support**: Single table handles ChatGPT, Claude, and future import sources
3. **Cleaner Code**: Removed migration terminology, clearer naming
4. **Extensibility**: Easy to add new import sources (Notion, Obsidian, etc.)
5. **One-Time Import Enforcement**: Each user can only import once per source
6. **Reactive Updates**: Frontend automatically updates via Convex subscriptions

## Migration Notes

### No Data Migration Required
The old `migration_tracking` table was already removed. This refactor creates a fresh `data_imports` table with proper structure.

### Backend Integration
The backend will need to be updated to use the new Convex endpoints:
- `api.chatgptImport.updateImportStatus` - Still works, now uses `data_imports`
- `api.chatgptImport.checkHasImported` - Still works, queries new table
- `api.chatgptImport.markImportComplete` - Still works, writes to new table

All function signatures remain the same, so backend code should work without changes.

## Future Import Sources

To add a new import source:

1. Add new literal to `importSourceValidator` in `convex/types/dataImport.ts`:
```typescript
export const importSourceValidator = v.union(
  v.literal("chatgpt"),
  v.literal("claude"),
  v.literal("notion"),  // New source
);
```

2. Create new file (e.g., `convex/notionImport.ts`) following the same pattern
3. Change `IMPORT_SOURCE` constant to your new source
4. Update job type filters if needed

## Query Examples

```typescript
// Check if user has imported from ChatGPT
const chatgptImport = await ctx.db
  .query("data_imports")
  .withIndex("by_user_source", (q) => 
    q.eq("userId", userId).eq("importSource", "chatgpt")
  )
  .first();

// Get all imports for a user
const allImports = await ctx.db
  .query("data_imports")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .collect();

// Get all running imports
const runningImports = await ctx.db
  .query("data_imports")
  .withIndex("by_status", (q) => q.eq("status", "running"))
  .collect();
```

## Testing

- ✅ No linter errors
- ✅ Schema compiles correctly
- ✅ All functions use correct table
- ✅ Frontend comment updated
- ✅ Claude import template created
- ✅ Extensibility demonstrated

## Rollout

1. Deploy schema changes first (adds new table)
2. Deploy Convex functions (chatgptImport.ts, claudeImport.ts)
3. Deploy frontend updates (comment change only)
4. No backend changes needed (APIs unchanged)

