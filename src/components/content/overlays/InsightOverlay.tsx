"use client";

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { normalizePrefixedId, validatePrefixedId } from '@/lib/content-utils';
import { Lightbulb, X, AlertTriangle } from 'lucide-react';
import { ContentOverlay } from '@/components/ui/ContentOverlay';
import { InsightContent } from '@/components/content/InsightContent';

interface InsightOverlayProps {
  insightId: string;
  onClose: () => void;
  showAnalysis?: boolean;
}

export const InsightOverlay: React.FC<InsightOverlayProps> = ({
  insightId,
  onClose,
  showAnalysis = true
}) => {
  // Get userId with proper error handling - never allow empty string
  const userId = getCurrentUserId();
  
  // Validate and normalize insightId
  const isValidInsightId = !!(insightId && insightId.trim() !== '');
  let normalizedPrefixedId = '';
  let isValidPrefixedId = false;

  if (isValidInsightId) {
    // Handle both direct prefixed IDs and raw insight IDs
    const rawPrefixedId = insightId.startsWith('insight:') ? insightId : `insight:${insightId}`;
    
    // Normalize the prefixed ID (handles legacy 4-part insight format)
    normalizedPrefixedId = normalizePrefixedId(rawPrefixedId);
    
    // Validate the normalized ID
    const validation = validatePrefixedId(normalizedPrefixedId);
    isValidPrefixedId = validation.isValid;
    
    if (!isValidPrefixedId && process.env.NODE_ENV === 'development') {
      console.error('[InsightOverlay] Invalid insight ID:', {
        original: insightId,
        raw: rawPrefixedId,
        normalized: normalizedPrefixedId,
        error: validation.error
      });
    }
  }

  // Fetch insight data - use "skip" when conditions aren't met
  const insightData = useQuery(
    api.notes.getContentByPrefixedId,
    userId && isValidPrefixedId ? {
      prefixedId: normalizedPrefixedId,
      userId
    } : "skip"
  );

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[InsightOverlay] Initializing with:', {
      insightId,
      userId: userId ? `${userId.substring(0, 8)}...` : 'null',
      showAnalysis,
      isValidInsightId
    });
  }

  // Handle invalid insightId
  if (!isValidInsightId) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[InsightOverlay] Invalid insightId:', { insightId, type: typeof insightId });
    }
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Invalid Request</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">Invalid insight ID provided.</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle no userId case
  if (!userId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[InsightOverlay] No userId available');
    }
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Authentication Required</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <p className="text-orange-700">Please sign in to view this insight.</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (insightData === undefined) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[InsightOverlay] Loading insight data for:', insightId);
    }
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Loading...</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="w-full h-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Handle insight not found or access denied
  if (insightData === null) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[InsightOverlay] Insight not found or access denied for:', insightId);
    }
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Insight Unavailable</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted border rounded-lg">
            <Lightbulb className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <p className="text-muted-foreground">This insight is no longer available or you don't have access to it.</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle query errors
  if (typeof insightData === 'object' && 'error' in insightData) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[InsightOverlay] Query error:', insightData.error);
    }
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Error</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">Failed to load insight. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  // Validate insight data structure
  if (!insightData || typeof insightData !== 'object' || !insightData.type || insightData.type !== 'insight') {
    if (process.env.NODE_ENV === 'development') {
      console.error('[InsightOverlay] Invalid insight data structure:', insightData);
    }
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Invalid Data</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">Invalid insight data received.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ContentOverlay
      onClose={onClose}
      title={insightData.title || 'Content Insight'}
      subtitle="AI-Generated Insight"
      icon={<Lightbulb className="w-8 h-8 text-yellow-500" />}
    >
      <InsightContent
        insightData={insightData}
        showAnalysis={showAnalysis}
      />
    </ContentOverlay>
  );
}; 