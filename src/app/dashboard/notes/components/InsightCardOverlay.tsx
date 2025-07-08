"use client";

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { 
  Lightbulb, 
  Target,
  TrendingUp,
  Calendar,
  ExternalLink,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Clock,
  Users,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { InsightCard } from '../../ai-insights/_components/InsightCard';

interface InsightCardOverlayProps {
  insightId: string;
  onClose: () => void;
  onOpenAnalysis?: (insightId: string) => void;
}

export const InsightCardOverlay: React.FC<InsightCardOverlayProps> = ({
  insightId,
  onClose,
  onOpenAnalysis
}) => {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const router = useRouter();

  // Parse insight ID to get analysisId and index
  const [analysisId, indexStr] = insightId.replace('insight:', '').split(':');
  const insightIndex = parseInt(indexStr, 10);

  // Fetch insight data
  const insightData = useQuery(api.notes.getContentByPrefixedId, {
    prefixedId: insightId,
    userId: userId || ''
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Remove the automatic navigation - let the user choose when to navigate

  if (!insightData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <h3 className="text-lg font-semibold">Opening Insight...</h3>
          </div>
          <div className="w-full h-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Helper function to render insight content
  const renderInsightContent = (insight: any) => {
    if (!insight) return null;
    
    // Handle different insight formats
    if (typeof insight === 'string') {
      return (
        <div className="bg-background rounded-lg p-3">
          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Insight Analysis
          </h5>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {insight}
          </p>
        </div>
      );
    }
    
    if (typeof insight === 'object') {
      return (
        <div className="space-y-3">
          {insight.impact && (
            <div className="bg-background rounded-lg p-3">
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Impact
              </h5>
              <p className="text-sm text-muted-foreground">
                {insight.impact}
              </p>
            </div>
          )}
          
          {insight.whyNow && Array.isArray(insight.whyNow) && (
            <div className="bg-background rounded-lg p-3">
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Why Now
              </h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                {insight.whyNow.map((reason: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-xs mt-1">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {insight.actionSteps && Array.isArray(insight.actionSteps) && (
            <div className="bg-background rounded-lg p-3">
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Action Steps
              </h5>
              <ol className="text-sm text-muted-foreground space-y-1">
                {insight.actionSteps.map((step: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-xs mt-1">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          
          {insight.expectedOutcome && (
            <div className="bg-background rounded-lg p-3">
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Expected Outcome
              </h5>
              <p className="text-sm text-muted-foreground">
                {insight.expectedOutcome}
              </p>
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-8 h-8 text-yellow-500" />
                  <div>
                    <h1 className="text-2xl font-bold">Insight Analysis</h1>
                  </div>
                </div>
              </div>
              <button
                title="Close"
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Card */}
        <div className="w-full flex items-center justify-center py-8">
          <div className="w-full max-w-3xl px-6">
            <InsightCard
              platform={(insightData.platform as 'youtube' | 'instagram' | 'gmail') || 'youtube'}
              title={insightData.title || 'Insight Analysis'}
              impact={insightData.analysis?.impact || ''}
              whyNow={insightData.analysis?.whyNow || []}
              actionSteps={insightData.analysis?.actionSteps || []}
              expectedOutcome={insightData.analysis?.expectedOutcome || ''}
              sourceDetails={insightData.analysis?.sourceDetails || []}
              relatedItems={insightData.analysis?.relatedItems || []}
              expanded={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 