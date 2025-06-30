"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  X, 
  ChevronRight, 
  TrendingUp, 
  BarChart3,
  Lightbulb,
  Target,
  Calendar,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CreateNoteButton } from '@/components/ui/CreateNoteButton';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';

interface InsightCardProps {
  analysisId: string;
  insightIndex: number;
  onClose: () => void;
  onOpenAnalysis?: (analysisId: string, insightIndex: number) => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  analysisId,
  insightIndex,
  onClose,
  onOpenAnalysis
}) => {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch all linkable content to get the insight data
  const allLinkableContent = useQuery(api.notes.getAllLinkableContent, {
    userId: firebaseUser?.uid || ''
  });

  // Find the specific insight
  const insightId = `insight:${analysisId}:${insightIndex}`;
  const insight = allLinkableContent?.find(content => content.id === insightId);

  const handleViewFullInsight = () => {
    if (onOpenAnalysis) {
      onOpenAnalysis(analysisId, insightIndex);
    } else {
      // Fallback: navigate directly to the insight page
      router.push(`/dashboard/notes/insight-analysis/${encodeURIComponent(insightId)}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-background">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
              <Lightbulb className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold">
              {insight ? insight.title : 'Insight Preview'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleViewFullInsight}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              View Full Analysis
            </Button>
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
            </Button>
            <Button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <CardContent className="p-6">
          {insight ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">{insight.title}</h4>
                <p className="text-sm text-muted-foreground">
                  Generated from YouTube batch analysis
                </p>
              </div>

              {/* Tags */}
              {insight.tags && insight.tags.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">Tags</h5>
                  <div className="flex flex-wrap gap-1">
                    {insight.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Insight content preview */}
              {insight.analysis && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Analysis Preview
                  </h5>
                  <div className="text-sm text-muted-foreground line-clamp-3">
                    {typeof insight.analysis === 'string' 
                      ? insight.analysis.substring(0, 300) + (insight.analysis.length > 300 ? '...' : '')
                      : 'Analysis content available'
                    }
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <Calendar className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  <div className="text-xs text-muted-foreground">
                    {new Date(insight.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-center">
                  <BarChart3 className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  <div className="text-xs text-muted-foreground">
                    {insight.tags?.length || 0} tags
                  </div>
                </div>
                <div className="text-center">
                  <Lightbulb className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  <div className="text-xs text-muted-foreground">
                    Insight #{insightIndex + 1}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-2 border-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Loading Insight...
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Fetching insight details from analysis {analysisId} at index {insightIndex}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 