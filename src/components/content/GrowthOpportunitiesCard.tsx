"use client";

import React from 'react';
import { ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

interface GrowthOpportunitiesCardProps {
  analysis: any;
}

export const GrowthOpportunitiesCard: React.FC<GrowthOpportunitiesCardProps> = ({
  analysis
}) => {
  return (
    <Card className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border border-border/50 hover:border-border">
      <CardHeader className="pb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <ChevronUp className="w-5 h-5 text-accent" />
          Growth Opportunities
        </h3>
        <CardDescription className="text-muted-foreground">
          Strategies and opportunities to expand your reach and engagement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top: Strengths and Growth Vectors in two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Unique Strengths - left */}
          <div className="space-y-2">
            {analysis?.uniqueStrengths && Array.isArray(analysis.uniqueStrengths) && analysis.uniqueStrengths.length > 0 && (
              <>
                <h4 className="text-sm font-medium text-muted-foreground">Unique Strengths</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.uniqueStrengths.map((strength: string, index: number) => (
                    <div 
                      key={index}
                      className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium rounded border border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                    >
                      {strength}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Growth Vectors - right */}
          <div className="space-y-2">
            {analysis?.growthVectors && Array.isArray(analysis.growthVectors) && analysis.growthVectors.length > 0 && (
              <>
                <h4 className="text-sm font-medium text-muted-foreground">Growth Vectors</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.growthVectors.map((vector: string, index: number) => (
                    <div 
                      key={index}
                      className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      {vector}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Middle: Audience Connection (highlighted) */}
        {analysis?.audienceConnection && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Audience Connection</h4>
            <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
              <p className="text-sm text-foreground leading-relaxed">{analysis.audienceConnection}</p>
            </div>
          </div>
        )}

        {/* Bottom: Recommended Topics and Potential Titles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recommended Topics - left */}
          <div className="space-y-2">
            {analysis?.recommendedTopics && Array.isArray(analysis.recommendedTopics) && analysis.recommendedTopics.length > 0 && (
              <>
                <h4 className="text-sm font-medium text-muted-foreground">Recommended Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.recommendedTopics.map((topic: string, index: number) => (
                    <div 
                      key={index}
                      className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs font-medium rounded border border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      {topic}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Potential Titles - right */}
          <div className="space-y-2">
            {analysis?.potentialTitles && Array.isArray(analysis.potentialTitles) && analysis.potentialTitles.length > 0 && (
              <>
                <h4 className="text-sm font-medium text-muted-foreground">Potential Titles</h4>
                <div className="space-y-2">
                  {analysis.potentialTitles.map((title: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/30 hover:bg-muted/50 transition-colors">
                      <span className="text-sm font-bold text-accent flex-shrink-0">{index + 1}.</span>
                      <p className="text-sm font-medium text-foreground leading-relaxed">{title}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer: Innovation Opportunities */}
        {analysis?.innovationOpportunities && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Innovation Opportunities</h4>
            <div className="text-sm text-foreground leading-relaxed">
              {analysis.innovationOpportunities}
            </div>
          </div>
        )}

        {/* Show message if no growth data available */}
        {!analysis?.uniqueStrengths && 
         !analysis?.growthVectors && 
         !analysis?.recommendedTopics && 
         !analysis?.potentialTitles &&
         !analysis?.audienceConnection &&
         !analysis?.innovationOpportunities && (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
              <ChevronUp className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No growth opportunities available in this analysis
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 