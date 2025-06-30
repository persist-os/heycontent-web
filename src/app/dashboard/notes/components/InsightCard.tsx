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
  const [isExpanded, setIsExpanded] = useState(false);

  // For now, we'll show a placeholder since we need to fetch the insight data
  // This will be enhanced when we implement the insight fetching logic

  // Directly navigate to the insight page
  React.useEffect(() => {
    if (onOpenAnalysis) {
      onOpenAnalysis(analysisId, insightIndex);
    } else {
      // Fallback: navigate directly to the insight page
      router.push(`/dashboard/notes/insight-analysis/${analysisId}/${insightIndex}`);
    }
    // Close the modal after navigation
    onClose();
  }, [analysisId, insightIndex, onOpenAnalysis, router, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-background">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
              <Lightbulb className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold">Insight Preview</h3>
          </div>
          <div className="flex items-center gap-2">
            {onOpenAnalysis && (
              <Button
                onClick={() => onOpenAnalysis(analysisId, insightIndex)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                View Full Insight
              </Button>
            )}
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
          <div className="text-center py-8">
            <div className="w-16 h-16 border-2 border-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Opening Insight...
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Loading insight details from analysis {analysisId} at index {insightIndex}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 