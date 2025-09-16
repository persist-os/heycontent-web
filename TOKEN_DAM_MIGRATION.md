# Token Dam Migration: Single User Dam

## Overview
The token dam system has been redesigned to use **one dam per user** instead of multiple dams per conversation. This creates a proper "dam" pattern that accumulates tokens across all user conversations and processes them efficiently.

## Key Changes

### Schema Changes
- **Before**: Multiple `token_dam_state` records per user (one per conversation)
- **After**: Single `token_dam_state` record per user
- **New fields**: `accumulatedConversations[]`, `lastConversationId`
- **Removed indexes**: `by_user_conversation`, `by_conversation`

### API Changes

#### Queries
- `getDamStatus`: Now takes only `userId` (conversationId optional for backward compatibility)
- `isProcessingAllowed`: Now takes only `userId` (conversationId optional)
- `getUserDamOverview`: Replaced with single dam status

#### Mutations
- `updateDamState`: Now accumulates across all conversations for user
- `processDam`: New mutation to drain dam when threshold reached
- `resetDamState`: Now resets entire user dam, not per-conversation

### Frontend Integration

#### Updated Components
- `TokenDamWarning`: Now shows user-level dam status
- `useTokenDamCheck`: Checks user-level dam permissions
- `DamStatusSection`: Displays single user dam in debug panel

#### Usage Examples
```typescript
// Before (per conversation)
const damStatus = useQuery(api.tokenDamQueries.getDamStatus, {
  userId,
  conversationId
});

// After (per user)
const damStatus = useQuery(api.tokenDamQueries.getDamStatus, {
  userId
});
```

## How The Dam Works Now

1. **Accumulation**: User tokens from ALL conversations accumulate in single dam
2. **Threshold**: When dam reaches 500+ tokens, processing triggers
3. **Processing**: All accumulated conversations processed together
4. **Drainage**: Dam resets to 0 tokens after processing
5. **Limits**: User blocked when exceeding subscription token limits

## Benefits

- ✅ **Proper dam pattern**: Accumulate → Process → Drain
- ✅ **Efficient processing**: Batch process multiple conversations
- ✅ **Fair usage**: Consistent token budgets per user
- ✅ **Simpler UI**: Single progress indicator per user
- ✅ **Better performance**: Fewer database queries and updates

## Migration Notes

### Breaking Changes
- Frontend components must use `userId` only (not `conversationId`)
- Dam status is now user-wide, not conversation-specific
- Processing triggers affect all user conversations

### Backward Compatibility
- Query arguments accept optional `conversationId` for gradual migration
- Existing conversation flows continue to work
- Warning components still accept `conversationId` prop (ignored)

## Testing
To test the new system:
1. Create conversations with a user
2. Add messages until 500+ tokens accumulated
3. Verify dam processing triggers automatically
4. Check dam resets to 0 after processing
5. Verify user blocked when limits exceeded
