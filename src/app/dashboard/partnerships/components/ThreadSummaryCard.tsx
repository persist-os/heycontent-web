'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  // Generate theme-based color classes
  const getThemeClasses = (color: string) => {
    const colors = {
      blue: {
        cardBg: 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20',
        cardBorder: 'border-blue-200 dark:border-blue-800/50',
        badgeBg: 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
        textPrimary: 'text-blue-900 dark:text-blue-100',
        textSecondary: 'text-blue-600 dark:text-blue-400',
        textTertiary: 'text-blue-800 dark:text-blue-200',
        textQuaternary: 'text-blue-700 dark:text-blue-300',
        loadingDots: 'bg-blue-500'
      },
      purple: {
        cardBg: 'from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20',
        cardBorder: 'border-purple-200 dark:border-purple-800/50',
        badgeBg: 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200',
        textPrimary: 'text-purple-900 dark:text-purple-100',
        textSecondary: 'text-purple-600 dark:text-purple-400',
        textTertiary: 'text-purple-800 dark:text-purple-200',
        textQuaternary: 'text-purple-700 dark:text-purple-300',
        loadingDots: 'bg-purple-500'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const themeClasses = getThemeClasses(themeColor);

  return (
    <Card className={`p-4 bg-gradient-to-r ${themeClasses.cardBg} ${themeClasses.cardBorder}`}>
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold ${themeClasses.textPrimary}`}>
            Summary
          </h3>
          <Badge variant="default" className={themeClasses.badgeBg}>
            Partnership
          </Badge>
        </div>

        {/* Metrics - Inline and Left Aligned */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <MessageSquare className={`w-4 h-4 ${themeClasses.textSecondary}`} />
            <span className={themeClasses.textSecondary}>Messages:</span>
            <span className={`font-medium ${themeClasses.textPrimary}`}>
              {partnership.messageCount}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className={`w-4 h-4 ${themeClasses.textSecondary}`} />
            <span className={themeClasses.textSecondary}>Est. Value:</span>
            <span className={`font-medium ${themeClasses.textPrimary}`}>
              {formatValue(partnership.estimatedValue)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={themeClasses.textSecondary}>Last Activity:</span>
            <span className={`font-medium ${themeClasses.textPrimary}`}>
              {formatTimeAgo(partnership.lastActivity)}
            </span>
          </div>
        </div>

        {/* AI Analysis Section */}
        {(analysisText || isAnalysisLoading) && (
          <div className="mt-3">
            {isAnalysisLoading ? (
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 ${themeClasses.loadingDots} rounded-full animate-bounce [animation-delay:-0.3s]`}></div>
                <div className={`w-2 h-2 ${themeClasses.loadingDots} rounded-full animate-bounce [animation-delay:-0.15s]`}></div>
                <div className={`w-2 h-2 ${themeClasses.loadingDots} rounded-full animate-bounce`}></div>
                <span className={`text-sm ${themeClasses.textQuaternary}`}>Analyzing conversation...</span>
              </div>
            ) : analysisText && (
              <p className={`text-sm ${themeClasses.textTertiary} leading-relaxed`}>
                {analysisText}
              </p>
            )}
          </div>
        )}


      </div>
    </Card>
  );
}
