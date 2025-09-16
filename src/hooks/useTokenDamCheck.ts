import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface UseTokenDamCheckProps {
  userId: string;
  conversationId?: Id<"conversations">;
}

interface TokenDamCheckResult {
  isAllowed: boolean;
  damStatus: 'open' | 'approaching' | 'full' | 'blocked';
  reasonBlocked?: string;
  percentageFull: number;
  tokensRemaining: number;
  isLoading: boolean;
}

/**
 * Hook for checking if expensive operations should proceed based on token dam status
 * 
 * Use this before starting expensive operations like:
 * - Persona crystallization
 * - Vector search
 * - Large language model calls
 * 
 * @example
 * ```tsx
 * const { isAllowed, damStatus, reasonBlocked } = useTokenDamCheck({
 *   userId,
 *   conversationId
 * });
 * 
 * if (!isAllowed) {
 *   console.warn('Operation blocked:', reasonBlocked);
 *   return;
 * }
 * 
 * // Proceed with expensive operation
 * ```
 */
export function useTokenDamCheck({ 
  userId, 
  conversationId 
}: UseTokenDamCheckProps): TokenDamCheckResult {
  
  const processingStatus = useQuery(
    api.tokenDamQueries.isProcessingAllowed,
    userId ? { userId } : "skip"
  );

  const damStatus = useQuery(
    api.tokenDamQueries.getDamStatus,
    userId ? { userId } : "skip"
  );

  const isLoading = processingStatus === undefined || damStatus === undefined;

  if (isLoading || !userId) {
    return {
      isAllowed: true, // Default to allowed when loading
      damStatus: 'open',
      percentageFull: 0,
      tokensRemaining: 0,
      isLoading: true
    };
  }

  return {
    isAllowed: processingStatus?.allowed ?? true,
    damStatus: processingStatus?.damStatus ?? 'open',
    reasonBlocked: processingStatus?.reasonBlocked,
    percentageFull: processingStatus?.percentageFull ?? 0,
    tokensRemaining: damStatus?.exists ? damStatus.tokensRemaining : 0,
    isLoading: false
  };
}

/**
 * Hook specifically for checking before starting conversations
 * Returns more permissive results since new conversations should generally be allowed
 */
export function useTokenDamCheckForNewConversation(userId: string) {
  // For new conversations, we're more permissive - only block if user has exceeded limits globally
  const userDamOverview = useQuery(
    api.tokenDamQueries.getUserDamOverview,
    { userId, limit: 5 }
  );

  const isLoading = userDamOverview === undefined;

  if (isLoading) {
    return {
      isAllowed: true,
      isLoading: true,
      blockedConversations: 0
    };
  }

  const blockedConversations = userDamOverview.conversations.filter(
    conversation => conversation.damStatus === 'blocked'
  ).length;

  // Allow new conversations unless user has too many blocked conversations
  const isAllowed = blockedConversations < 3;

  return {
    isAllowed,
    isLoading: false,
    blockedConversations,
    reasonBlocked: isAllowed ? undefined : 'Too many active conversations at token limits'
  };
}

export default useTokenDamCheck;
