"use client";

import React from 'react';
import { Sparkles, Edit, Users, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

interface RecommendationsCardProps {
  analysis: any;
}

export const RecommendationsCard: React.FC<RecommendationsCardProps> = ({
  analysis
}) => {
  return (
    <Card className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border border-border/50 hover:border-border">
      <CardHeader className="pb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Sparkles className="w-5 h-5 text-accent" />
          AI Recommendations
        </h3>
        <CardDescription className="text-muted-foreground">
          AI-powered suggestions to improve your content performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Narrative Improvements */}
        {analysis?.narrativeImprovements && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-base font-medium text-foreground">
              <Edit className="w-4 h-4 text-accent" />
              Narrative Improvements
            </h4>
            <div className="p-4 bg-muted/30 rounded-lg border border-border/30 hover:bg-muted/50 transition-colors">
              <p className="text-sm text-foreground leading-relaxed">{analysis.narrativeImprovements}</p>
            </div>
          </div>
        )}

        {/* Engagement Enhancements */}
        {analysis?.engagementEnhancements && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-base font-medium text-foreground">
              <Users className="w-4 h-4 text-accent" />
              Engagement Enhancements
            </h4>
            <div className="p-4 bg-muted/30 rounded-lg border border-border/30 hover:bg-muted/50 transition-colors">
              <p className="text-sm text-foreground leading-relaxed">{analysis.engagementEnhancements}</p>
            </div>
          </div>
        )}

        {/* Flow Optimization */}
        {analysis?.cognitiveFlowOptimizations && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-base font-medium text-foreground">
              <ArrowRight className="w-4 h-4 text-accent" />
              Flow Optimization
            </h4>
            <div className="p-4 bg-muted/30 rounded-lg border border-border/30 hover:bg-muted/50 transition-colors">
              <p className="text-sm text-foreground leading-relaxed">{analysis.cognitiveFlowOptimizations}</p>
            </div>
          </div>
        )}

        {/* Show message if no recommendations available */}
        {!analysis?.narrativeImprovements && 
         !analysis?.engagementEnhancements && 
         !analysis?.cognitiveFlowOptimizations && (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No recommendations available in this analysis
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 