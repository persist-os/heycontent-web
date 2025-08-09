'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { MessageSquare, DollarSign } from 'lucide-react';

// Constants
const HOURS_IN_MS = 1000 * 60 * 60;
const HOURS_IN_DAY = 24;
const DAYS_IN_WEEK = 7;
const MILLION = 1000000;
const THOUSAND = 1000;

// Utility functions
const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diffInMs = now - timestamp;
  const diffInHours = diffInMs / HOURS_IN_MS;
  const diffInDays = diffInHours / HOURS_IN_DAY;
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < HOURS_IN_DAY) return `${Math.floor(diffInHours)}h ago`;
  if (diffInDays < DAYS_IN_WEEK) return `${Math.floor(diffInDays)}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
};

const formatValue = (value: number): string => {
  if (value === 0) return 'Not specified';
  if (value >= MILLION) return `$${(value / MILLION).toFixed(1)}M`;
  if (value >= THOUSAND) return `$${(value / THOUSAND).toFixed(1)}K`;
  return `$${value}`;
};

interface PartnershipSummary {
  readonly messageCount: number;
  readonly lastActivity: number;
  readonly estimatedValue: number;
  readonly from: string;
  readonly subject: string;
  readonly brandName: string;
}

interface ThreadSummaryCardProps {
  readonly partnership?: PartnershipSummary;
  readonly analysisText?: string;
  readonly isAnalysisLoading?: boolean;
  readonly themeColor?: string;
}

export function ThreadSummaryCard({
  partnership,
  analysisText,
  isAnalysisLoading,
  themeColor = 'blue'
}: ThreadSummaryCardProps) {
  if (!partnership) return null;

  // Get theme colors - simplified to only handle the actual color values
  const getThemeColor = (color: string): string => {
    const colors = {
      purple: '#9D89F7',    // Partnership
      pink: '#FF96FB',      // Media
      teal: '#40E3FF',      // Business  
      green: '#9BE7B2',     // Community
      yellow: '#FFDF39'     // Default/Uncategorized - HeyContent Yellow
    };
    return colors[color as keyof typeof colors] || colors.yellow;
  };

  const themeColorHex = getThemeColor(themeColor);
  const isYellow = themeColor === 'yellow';

  // Map themeColor to static Tailwind classes for background and border
  const themeColorClasses: Record<string, string> = {
    purple: 'bg-purple-100/50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50',
    pink: 'bg-pink-100/50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800/50',
    teal: 'bg-cyan-100/50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800/50',
    green: 'bg-green-100/50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50',
    yellow: 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800/50',
  };

  const cardClassName = `p-4 ${themeColorClasses[themeColor] || themeColorClasses.yellow}`;

  return (
    <Card 
      className={cardClassName}
    >
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">
            Summary
          </h3>
        </div>

        {/* Metrics - Inline and Left Aligned */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Messages:</span>
            <span className="font-medium text-foreground">
              {partnership.messageCount}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Est. Value:</span>
            <span className="font-medium text-foreground">
              {formatValue(partnership.estimatedValue)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Last Activity:</span>
            <span className="font-medium text-foreground">
              {formatTimeAgo(partnership.lastActivity)}
            </span>
          </div>
        </div>

        {/* AI Analysis Section */}
        {(analysisText || isAnalysisLoading) && (
          <div className="mt-3">
            {isAnalysisLoading ? (
              <div className="space-y-2">
                <div 
                  className="h-4 bg-foreground/20 dark:bg-foreground/10 rounded w-full origin-left"
                  style={{
                    animation: 'biPulse 2s ease-in-out infinite',
                    animationDelay: '0s'
                  }}
                ></div>
                <div 
                  className="h-4 bg-foreground/20 dark:bg-foreground/10 rounded w-4/5 origin-left"
                  style={{
                    animation: 'biPulse 2s ease-in-out infinite',
                    animationDelay: '0.3s'
                  }}
                ></div>
                <style jsx global>{`
                  @keyframes biPulse {
                    0%, 100% { 
                      transform: scale(1, 1);
                      opacity: 0.8;
                    }
                    50% { 
                      transform: scale(1.01, 1.05);
                      opacity: 0.4;
                    }
                  }
                `}</style>
              </div>
            ) : analysisText && (
              <p className="text-sm text-foreground leading-relaxed">
                {analysisText}
              </p>
            )}
          </div>
        )}


      </div>
    </Card>
  );
}
