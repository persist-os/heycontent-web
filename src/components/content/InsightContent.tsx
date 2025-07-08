"use client";

import React from 'react';
import { Lightbulb, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkdownRenderer } from '@/app/dashboard/chat/markdown-renderer';

interface InsightContentProps {
  insightData: any;
  showAnalysis?: boolean;
}

export const InsightContent: React.FC<InsightContentProps> = ({
  insightData,
  showAnalysis = true
}) => {
  // Helper function to render insight content
  const renderInsightContent = (content: string) => {
    if (!content) return null;
    
    return (
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Analysis
          </h4>
          <div className="text-sm text-muted-foreground">
            <MarkdownRenderer content={content} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Insight Content */}
      {showAnalysis && insightData.content && (
        <Card>
          <CardHeader>
            <CardTitle>Insight Analysis</CardTitle>
            <CardDescription>AI-powered analysis of your content</CardDescription>
          </CardHeader>
          <CardContent>
            {renderInsightContent(insightData.content)}
          </CardContent>
        </Card>
      )}
    </>
  );
}; 