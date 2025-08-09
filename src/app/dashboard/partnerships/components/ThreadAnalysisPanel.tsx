'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Brain, 
  Target, 
  TrendingUp, 
  Clock, 
  Users, 
  AlertCircle,
  CheckCircle2,
  Mail,
  Calendar
} from 'lucide-react';

// Types
interface ThreadAnalysisData {
  readonly actionSteps?: string[];
  readonly confidence?: number;
  readonly expectedOutcome?: string;
  readonly impact?: string;
  readonly platform?: string;
  readonly relatedItems?: Array<{
    readonly sender?: string;
    readonly stage?: string;
    readonly urgency?: string;
    readonly value?: string;
  }>;
  readonly sourceDetails?: string[];
  readonly threadDetails?: Array<{
    readonly date?: string;
    readonly from?: string;
    readonly snippet?: string;
    readonly subject?: string;
    readonly threadId?: string;
  }>;
  readonly threadSummary?: string;
  readonly timing?: string;
  readonly title?: string;
  readonly whyNow?: string[];
}

interface ThreadAnalysisPanelProps {
  readonly analysisData?: ThreadAnalysisData | null;
  readonly isAnalysisLoading?: boolean;
  readonly onAnalyzeThread?: () => void;
  readonly themeColor?: string;
}

interface AnalysisSection {
  readonly id: string;
  readonly title: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly content: React.ReactNode;
  readonly isEmpty: boolean;
  readonly priority: number;
}

export function ThreadAnalysisPanel({
  analysisData,
  isAnalysisLoading = false,
  onAnalyzeThread,
  themeColor = 'blue'
}: ThreadAnalysisPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  // Get theme colors
  const getThemeColor = (color: string): string => {
    const colors = {
      purple: '#9D89F7',
      pink: '#FF96FB', 
      teal: '#40E3FF',
      green: '#9BE7B2',
      yellow: '#FFDF39'
    };
    return colors[color as keyof typeof colors] || colors.yellow;
  };

  const themeColorHex = getThemeColor(themeColor);
  const isYellow = themeColor === 'yellow';

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Format confidence score with visual indicator
  const formatConfidence = (confidence?: number) => {
    if (!confidence) return null;
    
    const getConfidenceColor = (score: number) => {
      if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      if (score >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    };

    return (
      <Badge className={`${getConfidenceColor(confidence)} border-0`}>
        {confidence}% confidence
      </Badge>
    );
  };

  // Create analysis sections
  const sections = useMemo((): AnalysisSection[] => {
    if (!analysisData) return [];

    return [
      {
        id: 'summary',
        title: 'Summary',
        icon: Brain,
        priority: 1,
        isEmpty: !analysisData.threadSummary,
        content: analysisData.threadSummary ? (
          <p className="text-sm text-foreground leading-relaxed">
            {analysisData.threadSummary}
          </p>
        ) : null
      },
      {
        id: 'actions',
        title: 'Action Steps',
        icon: Target,
        priority: 2,
        isEmpty: !analysisData.actionSteps?.length,
        content: analysisData.actionSteps?.length ? (
          <div className="space-y-3">
            {analysisData.actionSteps.map((step, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground mt-0.5">
                  {index + 1}
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
          </div>
        ) : null
      },
      {
        id: 'impact',
        title: 'Impact & Outcome',
        icon: TrendingUp,
        priority: 3,
        isEmpty: !analysisData.impact && !analysisData.expectedOutcome,
        content: (analysisData.impact || analysisData.expectedOutcome) ? (
          <div className="space-y-3">
            {analysisData.impact && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Impact
                </h4>
                <p className="text-sm text-foreground leading-relaxed">
                  {analysisData.impact}
                </p>
              </div>
            )}
            {analysisData.expectedOutcome && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Expected Outcome
                </h4>
                <p className="text-sm text-foreground leading-relaxed">
                  {analysisData.expectedOutcome}
                </p>
              </div>
            )}
          </div>
        ) : null
      },
      {
        id: 'timing',
        title: 'Timing & Urgency',
        icon: Clock,
        priority: 4,
        isEmpty: !analysisData.timing && !analysisData.whyNow?.length,
        content: (analysisData.timing || analysisData.whyNow?.length) ? (
          <div className="space-y-3">
            {analysisData.timing && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Badge variant="outline" className="text-xs">
                  {analysisData.timing}
                </Badge>
              </div>
            )}
            {analysisData.whyNow?.length && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Why Now
                </h4>
                <div className="space-y-2">
                  {analysisData.whyNow.map((reason, index) => (
                    <div key={index} className="flex gap-2">
                      <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground leading-relaxed">
                        {reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null
      },
      {
        id: 'related',
        title: 'Related Items',
        icon: Users,
        priority: 5,
        isEmpty: !analysisData.relatedItems?.length,
        content: analysisData.relatedItems?.length ? (
          <div className="space-y-3">
            {analysisData.relatedItems.map((item, index) => (
              <div key={index} className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    {item.sender && (
                      <p className="text-sm font-medium text-foreground">
                        {item.sender}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {item.stage && (
                        <Badge variant="outline" className="text-xs">
                          {item.stage}
                        </Badge>
                      )}
                      {item.urgency && (
                        <Badge variant="outline" className="text-xs">
                          {item.urgency}
                        </Badge>
                      )}
                      {item.value && (
                        <Badge variant="outline" className="text-xs">
                          {item.value}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null
      }
    ].filter(section => !section.isEmpty).sort((a, b) => a.priority - b.priority);
  }, [analysisData]);

  // Show analyze button if no analysis data
  if (!analysisData && !isAnalysisLoading) {
    return (
      <Card 
        className={`p-4 ${
          isYellow 
            ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800/50'
            : `bg-[${themeColorHex}]/[0.11] dark:bg-[${themeColorHex}]/[0.08] border-[${themeColorHex}]/20 dark:border-[${themeColorHex}]/30`
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-foreground">
                Thread Analysis
              </h3>
              <p className="text-sm text-muted-foreground">
                Get AI insights about this conversation
              </p>
            </div>
          </div>
          <Button 
            onClick={onAnalyzeThread}
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            Analyze Thread
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={`${
        isYellow 
          ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800/50'
          : `bg-[${themeColorHex}]/[0.11] dark:bg-[${themeColorHex}]/[0.08] border-[${themeColorHex}]/20 dark:border-[${themeColorHex}]/30`
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-foreground">
                {analysisData?.title || 'Thread Analysis'}
              </h3>
              {analysisData?.platform && (
                <p className="text-xs text-muted-foreground">
                  Platform: {analysisData.platform}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {formatConfidence(analysisData?.confidence)}
            {onAnalyzeThread && (
              <Button 
                onClick={onAnalyzeThread}
                size="sm"
                variant="ghost"
                disabled={isAnalysisLoading}
                className="text-xs"
              >
                Re-analyze
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isAnalysisLoading && (
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <div 
              className="h-4 bg-foreground/20 dark:bg-foreground/10 rounded w-full"
              style={{
                animation: 'pulse 2s ease-in-out infinite',
                animationDelay: '0s'
              }}
            />
            <div 
              className="h-4 bg-foreground/20 dark:bg-foreground/10 rounded w-4/5"
              style={{
                animation: 'pulse 2s ease-in-out infinite',
                animationDelay: '0.3s'
              }}
            />
            <div 
              className="h-4 bg-foreground/20 dark:bg-foreground/10 rounded w-3/5"
              style={{
                animation: 'pulse 2s ease-in-out infinite',
                animationDelay: '0.6s'
              }}
            />
          </div>
        </div>
      )}

      {/* Analysis Sections */}
      {!isAnalysisLoading && sections.length > 0 && (
        <div className="divide-y divide-border">
          {sections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            const Icon = section.icon;

            return (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground text-left">
                      {section.title}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                
                {isExpanded && section.content && (
                  <div className="px-4 pb-4">
                    <div className="pl-7">
                      {section.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isAnalysisLoading && sections.length === 0 && analysisData && (
        <div className="p-4 text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Analysis completed but no actionable insights found
          </p>
        </div>
      )}
    </Card>
  );
}
