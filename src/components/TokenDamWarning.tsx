'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { AlertTriangle, Clock, Zap } from 'lucide-react';

interface TokenDamWarningProps {
  userId: string;
  conversationId?: Id<"conversations">;
  className?: string;
}

/**
 * Token Dam Warning Component
 * 
 * Shows user-friendly warnings when approaching token limits.
 * This should be displayed in chat interfaces to guide user behavior.
 */
export const TokenDamWarning: React.FC<TokenDamWarningProps> = ({
  userId,
  conversationId,
  className = ""
}) => {
  const damStatus = useQuery(
    api.tokenDamQueries.getDamStatus,
    userId ? { userId } : "skip"
  );

  if (!userId || !damStatus || !damStatus.exists) {
    return null;
  }

  // Only show warnings when approaching limits
  const shouldShowWarning = damStatus.damStatus === 'approaching' || 
                           damStatus.damStatus === 'full' || 
                           damStatus.damStatus === 'blocked';

  if (!shouldShowWarning) {
    return null;
  }

  const getWarningConfig = () => {
    switch (damStatus.damStatus) {
      case 'blocked':
        return {
          icon: <Clock className="w-5 h-5" />,
          title: 'Processing Paused',
          message: 'Your conversation has reached the token limit. Processing will resume soon.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          buttonColor: 'bg-red-100 hover:bg-red-200 text-red-700'
        };
      case 'full':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'Near Token Limit',
          message: 'You\'re close to your token limit. Consider wrapping up this conversation.',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-700',
          buttonColor: 'bg-orange-100 hover:bg-orange-200 text-orange-700'
        };
      case 'approaching':
        return {
          icon: <Zap className="w-5 h-5" />,
          title: 'Approaching Token Limit',
          message: 'You\'ve used most of your tokens for this conversation.',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700',
          buttonColor: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
        };
      default:
        return null;
    }
  };

  const config = getWarningConfig();
  if (!config) return null;

  const percentage = Math.round(damStatus.percentageFull);

  return (
    <div className={`${className} ${config.bgColor} ${config.borderColor} ${config.textColor} border rounded-lg p-4 mb-4`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {config.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">
            {config.title}
          </h3>
          <p className="text-sm mb-3">
            {config.message}
          </p>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span>Token Usage</span>
              <span className="font-medium">{percentage}% of limit</span>
            </div>
            
            <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden relative">
              <div 
                className={`h-2 transition-all duration-300 absolute left-0 top-0 ${
                  damStatus.damStatus === 'blocked' ? 'bg-red-500' :
                  damStatus.damStatus === 'full' ? 'bg-orange-500' :
                  'bg-yellow-500'
                }`}
                style={{ 
                  width: `${Math.min(100, percentage)}%`,
                  willChange: 'width'
                }}
              />
            </div>
            
            <div className="flex justify-between text-xs opacity-75">
              <span>{damStatus.currentTokens.toLocaleString()} used</span>
              <span>{damStatus.tokensRemaining.toLocaleString()} remaining</span>
            </div>
          </div>
        </div>
      </div>
      
      {damStatus.damStatus === 'blocked' && damStatus.nextProcessingAllowed && (
        <div className="mt-3 pt-3 border-t border-current/20">
          <p className="text-xs">
            <Clock className="w-3 h-3 inline mr-1" />
            Processing will resume at {new Date(damStatus.nextProcessingAllowed).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default TokenDamWarning;
