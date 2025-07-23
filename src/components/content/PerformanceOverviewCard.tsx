"use client";

import React from 'react';
import { Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { YouTubeCardProps } from './types';

export const PerformanceOverviewCard: React.FC<YouTubeCardProps> = ({
  analysis
}) => {
  return (
    <Card className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border border-border/50 hover:border-border">
      <CardHeader className="pb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Eye className="w-5 h-5 text-accent" />
          Performance Overview
        </h3>
        <CardDescription className="text-muted-foreground">
          AI-generated performance analysis and content insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top section: Score (left) and Content Type (right) */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Performance Score - left side */}
          <div className="flex-1">
            {analysis?.performanceScore !== undefined ? (
              <div className="space-y-2" role="region" aria-label="Performance Score">
                <div className="flex items-baseline gap-2">
                  <span 
                    className={`text-4xl sm:text-5xl font-bold transition-colors ${
                      (analysis.performanceScore >= 0 && analysis.performanceScore <= 3) 
                        ? 'text-destructive'
                        : (analysis.performanceScore >= 4 && analysis.performanceScore <= 6)
                        ? 'text-yellow-600 dark:text-yellow-500'
                        : 'text-green-600 dark:text-green-500'
                    }`}
                    aria-label={`Performance score: ${analysis.performanceScore} out of 10, ${
                      analysis.performanceScore <= 3 ? 'needs improvement' : 
                      analysis.performanceScore <= 6 ? 'good' : 'excellent'
                    }`}
                  >
                    {analysis.performanceScore}
                  </span>
                  <span className="text-xl text-muted-foreground">/10</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    (analysis.performanceScore >= 0 && analysis.performanceScore <= 3) 
                      ? 'bg-destructive/10 text-destructive'
                      : (analysis.performanceScore >= 4 && analysis.performanceScore <= 6)
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  }`}>
                    {analysis.performanceScore <= 3 ? 'Needs Work' : 
                     analysis.performanceScore <= 6 ? 'Good' : 'Excellent'}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Performance Score
                </h4>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No performance score available</div>
            )}
          </div>

          {/* Content Type Badge - right side */}
          {analysis?.contentType && (
            <div className="flex-shrink-0">
              <div className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm font-medium rounded-full border border-border hover:bg-accent hover:text-accent-foreground transition-colors">
                {analysis.contentType}
              </div>
            </div>
          )}
        </div>

        {/* Performance Score Explanation - middle */}
        {analysis?.performanceScoreExplanation && (
          <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
            <p className="text-sm text-foreground leading-relaxed">
              {analysis.performanceScoreExplanation}
            </p>
          </div>
        )}

        {/* Main Topics - bottom */}
        {analysis?.mainTopics && Array.isArray(analysis.mainTopics) && analysis.mainTopics.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Main Topics</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.mainTopics.map((topic: string, index: number) => (
                <div 
                  key={index}
                  className="px-2 py-1 bg-accent/10 text-accent-foreground text-xs font-medium rounded border border-accent/20 hover:bg-accent/20 transition-colors"
                >
                  {topic}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 