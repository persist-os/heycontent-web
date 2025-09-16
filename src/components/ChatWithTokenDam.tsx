'use client';

import React from 'react';
import { Id } from '@/convex/_generated/dataModel';
import TokenDamWarning from './TokenDamWarning';
import { useTokenDamCheck } from '@/hooks/useTokenDamCheck';

interface ChatWithTokenDamProps {
  userId: string;
  conversationId?: Id<"conversations">;
  children: React.ReactNode;
  className?: string;
}

/**
 * Example wrapper component showing how to integrate token dam checks into chat interfaces
 * 
 * This component:
 * 1. Shows warnings when approaching token limits
 * 2. Provides a check function for before expensive operations
 * 3. Integrates seamlessly with existing chat components
 */
export const ChatWithTokenDam: React.FC<ChatWithTokenDamProps> = ({
  userId,
  conversationId,
  children,
  className = ""
}) => {
  const damCheck = useTokenDamCheck({ userId, conversationId });

  return (
    <div className={`token-dam-aware-chat ${className}`}>
      {/* Show token dam warning when needed */}
      <TokenDamWarning 
        userId={userId} 
        conversationId={conversationId}
        className="mb-4"
      />
      
      {/* Regular chat interface */}
      <div className={damCheck.damStatus === 'blocked' ? 'opacity-75' : ''}>
        {children}
      </div>
      
      {/* Optional status indicator for development */}
      {process.env.NODE_ENV === 'development' && damCheck.damStatus && (
        <div className="mt-2 text-xs text-gray-500 border-t pt-2">
          Token Dam: {damCheck.damStatus} ({damCheck.percentageFull.toFixed(1)}% full)
        </div>
      )}
    </div>
  );
};

export default ChatWithTokenDam;
