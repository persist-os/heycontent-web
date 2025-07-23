"use client";

import React from 'react';
import { MessageCircle, Sparkles, Heart, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

interface ContentAnalysisCardProps {
  analysis: any;
}

export const ContentAnalysisCard: React.FC<ContentAnalysisCardProps> = ({
  analysis
}) => {
  return (
    <Card className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border border-border/50 hover:border-border">
      <CardHeader className="pb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <MessageCircle className="w-5 h-5 text-accent" />
          Content Analysis
        </h3>
        <CardDescription className="text-muted-foreground">
          Narrative structure, emotional flow, and engagement analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top row: Narrative Score (left) and Engagement Triggers (right) */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Narrative Score - left */}
          <div className="flex-1">
            {analysis?.narrativeScore !== undefined ? (
              <div className="space-y-2" role="region" aria-label="Narrative Score">
                <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
                  <div className="flex items-baseline gap-2">
                    <span 
                      className={`text-3xl font-bold transition-colors ${
                        (analysis.narrativeScore >= 0 && analysis.narrativeScore <= 3) 
                          ? 'text-destructive'
                          : (analysis.narrativeScore >= 4 && analysis.narrativeScore <= 6)
                          ? 'text-yellow-600 dark:text-yellow-500'
                          : 'text-green-600 dark:text-green-500'
                      }`}
                      aria-label={`Narrative score: ${analysis.narrativeScore} out of 10, ${
                        analysis.narrativeScore <= 3 ? 'weak narrative' : 
                        analysis.narrativeScore <= 6 ? 'decent narrative' : 'strong narrative'
                      }`}
                    >
                      {analysis.narrativeScore}
                    </span>
                    <span className="text-lg text-muted-foreground">/10</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      (analysis.narrativeScore >= 0 && analysis.narrativeScore <= 3) 
                        ? 'bg-destructive/10 text-destructive'
                        : (analysis.narrativeScore >= 4 && analysis.narrativeScore <= 6)
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }`}>
                      {analysis.narrativeScore <= 3 ? 'Weak' : 
                       analysis.narrativeScore <= 6 ? 'Decent' : 'Strong'}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-muted-foreground mt-1">
                    Narrative Score
                  </h4>
                </div>
                {analysis?.narrativeScoreExplanation && (
                  <div className="text-sm text-foreground leading-relaxed">
                    {analysis.narrativeScoreExplanation}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No narrative score available</div>
            )}
          </div>

          {/* Engagement Triggers - right */}
          <div className="flex-shrink-0 lg:max-w-xs">
            {analysis?.engagementTriggers && Array.isArray(analysis.engagementTriggers) && analysis.engagementTriggers.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Engagement Triggers
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.engagementTriggers.map((trigger: string, index: number) => (
                    <div 
                      key={index}
                      className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded border border-orange-200 dark:border-orange-800 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                    >
                      {trigger}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle: Emotional Journey (highlighted) */}
        {analysis?.emotionalJourney && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Heart className="w-4 h-4 text-accent" />
              Emotional Journey
            </h4>
            <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
              <p className="text-sm text-foreground leading-relaxed font-medium">{analysis.emotionalJourney}</p>
            </div>
          </div>
        )}

        {/* Bottom: Pacing & Flow */}
        {analysis?.pacingAndFlow && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="w-4 h-4 text-accent" />
              Pacing & Flow
            </h4>
            <div className="text-sm text-foreground leading-relaxed">
              {analysis.pacingAndFlow}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 