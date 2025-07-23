"use client";

import React from 'react';
import { User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

interface AudienceInsightsCardProps {
  analysis: any;
}

export const AudienceInsightsCard: React.FC<AudienceInsightsCardProps> = ({
  analysis
}) => {
  return (
    <Card className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border border-border/50 hover:border-border">
      <CardHeader className="pb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <User className="w-5 h-5 text-accent" />
          Audience Insights
        </h3>
        <CardDescription className="text-muted-foreground">
          Sentiment analysis and comment insights from your audience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Two-column layout: Sentiment (left) and Comment Score (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Overall Sentiment */}
          <div className="space-y-2">
            {analysis?.overallSentiment !== undefined ? (
              <div className="space-y-2" role="region" aria-label="Overall Sentiment">
                <div className={`p-4 rounded-lg border transition-colors ${
                  (analysis.overallSentiment >= 0 && analysis.overallSentiment <= 40)
                    ? 'bg-destructive/10 border-destructive/20'
                    : (analysis.overallSentiment >= 41 && analysis.overallSentiment <= 70)
                    ? 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                }`}>
                  <div className="flex items-baseline gap-2">
                    <span 
                      className={`text-3xl font-bold transition-colors ${
                        (analysis.overallSentiment >= 0 && analysis.overallSentiment <= 40)
                          ? 'text-destructive'
                          : (analysis.overallSentiment >= 41 && analysis.overallSentiment <= 70)
                          ? 'text-yellow-600 dark:text-yellow-500'
                          : 'text-green-600 dark:text-green-500'
                      }`}
                      aria-label={`Overall sentiment: ${analysis.overallSentiment} percent, ${
                        analysis.overallSentiment <= 40 ? 'negative' : 
                        analysis.overallSentiment <= 70 ? 'mixed' : 'positive'
                      }`}
                    >
                      {analysis.overallSentiment}
                    </span>
                    <span className="text-lg text-muted-foreground">%</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      (analysis.overallSentiment >= 0 && analysis.overallSentiment <= 40)
                        ? 'bg-destructive/20 text-destructive'
                        : (analysis.overallSentiment >= 41 && analysis.overallSentiment <= 70)
                        ? 'bg-yellow-200 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                        : 'bg-green-200 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                    }`}>
                      {analysis.overallSentiment <= 40 ? 'Negative' : 
                       analysis.overallSentiment <= 70 ? 'Mixed' : 'Positive'}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-muted-foreground mt-1">
                    Overall Sentiment
                  </h4>
                </div>
                {analysis?.overallSentimentExplanation && (
                  <div className="text-sm text-foreground leading-relaxed">
                    {analysis.overallSentimentExplanation}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No sentiment data available</div>
            )}
          </div>

          {/* Right: Comment Section Score */}
          <div className="space-y-2">
            {analysis?.commentSectionScore !== undefined ? (
              <div className="space-y-2" role="region" aria-label="Comment Section Score">
                <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
                  <div className="flex items-baseline gap-2">
                    <span 
                      className={`text-3xl font-bold transition-colors ${
                        (analysis.commentSectionScore >= 0 && analysis.commentSectionScore <= 3) 
                          ? 'text-destructive'
                          : (analysis.commentSectionScore >= 4 && analysis.commentSectionScore <= 6)
                          ? 'text-yellow-600 dark:text-yellow-500'
                          : 'text-green-600 dark:text-green-500'
                      }`}
                      aria-label={`Comment section score: ${analysis.commentSectionScore} out of 10, ${
                        analysis.commentSectionScore <= 3 ? 'poor quality' : 
                        analysis.commentSectionScore <= 6 ? 'moderate quality' : 'high quality'
                      }`}
                    >
                      {analysis.commentSectionScore}
                    </span>
                    <span className="text-lg text-muted-foreground">/10</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      (analysis.commentSectionScore >= 0 && analysis.commentSectionScore <= 3) 
                        ? 'bg-destructive/10 text-destructive'
                        : (analysis.commentSectionScore >= 4 && analysis.commentSectionScore <= 6)
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }`}>
                      {analysis.commentSectionScore <= 3 ? 'Poor' : 
                       analysis.commentSectionScore <= 6 ? 'Moderate' : 'High Quality'}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-muted-foreground mt-1">
                    Comment Section Score
                  </h4>
                </div>
                {analysis?.commentSectionScoreExplanation && (
                  <div className="text-sm text-foreground leading-relaxed">
                    {analysis.commentSectionScoreExplanation}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No comment score available</div>
            )}
          </div>
        </div>

        {/* Full width: Key Takeaways */}
        {analysis?.comment_keyTakeaways && Array.isArray(analysis.comment_keyTakeaways) && analysis.comment_keyTakeaways.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Key Takeaways from Comments</h4>
            <div className="space-y-2">
              {analysis.comment_keyTakeaways.map((takeaway: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/30 hover:bg-muted/50 transition-colors">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-foreground leading-relaxed">{takeaway}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full width: Common Reactions */}
        {analysis?.comment_commonReactions && Array.isArray(analysis.comment_commonReactions) && analysis.comment_commonReactions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Common Reactions</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.comment_commonReactions.map((reaction: string, index: number) => (
                <div 
                  key={index}
                  className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded border border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                  {reaction}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 