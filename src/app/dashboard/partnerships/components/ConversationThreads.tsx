'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { 
  ChevronRight, 
  ChevronDown, 
  Mail,
  User,
  Clock,
  Reply,
  Brain,
  MessageSquare,
  DollarSign
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/convex/_generated/api';
import { getCurrentUserId, fetchWithApiKey } from '@/app/lib/api-helpers';
import { InlineEmailReply } from './InlineEmailReply';
import { ThreadSummaryCard } from './ThreadSummaryCard';
import { MessageList } from './MessageList';

// Constants
const ANIMATION_DURATION = '2s';
const ANIMATION_TIMING = 'ease-in-out infinite';
const LOADING_SKELETON_WIDTHS = ['w-4/5', 'w-3/4', 'w-1/2'] as const;
const SUMMARY_PREFIXES = ['Thread Summary:', 'Summary:', 'TL;DR:', 'TLDR:'] as const;
const MARKDOWN_CODE_BLOCK_REGEX = /```json\s*/g;
const MARKDOWN_CODE_END_REGEX = /```\s*$/g;
const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
};
const HOURS_IN_DAY = 24;
const DAYS_IN_WEEK = 7;
const HOURS_IN_MS = 1000 * 60 * 60;
const MILLION = 1000000;
const THOUSAND = 1000;

interface EmailMessage {
  readonly id: string;
  readonly from: string;
  readonly email: string;
  readonly subject: string;
  readonly body: string;
  readonly timestamp: number;
  readonly isReply: boolean;
  readonly isFromUser: boolean;
}

interface PartnershipSummary {
  readonly messageCount: number;
  readonly lastActivity: number;
  readonly estimatedValue: number;
  readonly from: string;
  readonly subject: string;
  readonly brandName: string;
}

interface EmailThreadData {
  readonly threadId?: string;
  readonly messages?: Array<{
    readonly from: string;
    readonly body: string;
    readonly timestamp: number;
  }>;
  readonly subject?: string;
  readonly brandName?: string;
  readonly recipientEmail?: string;
}

interface ConversationThreadsProps {
  readonly messages: EmailMessage[];
  readonly threadId: string; // Required - Gmail thread ID for analysis
  readonly userId: string; // Required - User ID for Convex queries
  readonly userEmail?: string | null;
  readonly selectedMessageId?: string;
  readonly partnership?: PartnershipSummary;
  readonly emailThreadData?: EmailThreadData;
  readonly onMessageSelect?: (messageId: string) => void;
  readonly onStartDraft?: () => void;
  readonly themeColor?: string; // Theme color for backgrounds and buttons
}

export function ConversationThreads({ 
  messages, 
  threadId,
  userId,
  userEmail, 
  selectedMessageId,
  partnership,
  emailThreadData,
  onMessageSelect,
  onStartDraft,
  themeColor = 'blue'
}: ConversationThreadsProps) {
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [isDraftingReply, setIsDraftingReply] = useState(false);

  // Convex queries for analysis
  const threadAnalysis = useQuery(
    api.gmailQueries.getGmailThreadByThreadId,
    { userId, threadId }
  );

  // Analysis and draft handlers
  const handleAnalyzeThread = useCallback(async () => {
    if (analysisLoading) return;

    setAnalysisLoading(true);
    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        console.error('User not authenticated, cannot analyze thread');
        return;
      }

      const response = await fetchWithApiKey('/api/gmail/analyze-thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          userId: currentUserId
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Analysis completed:', result);
    } catch (error) {
      console.error('Failed to analyze thread:', error);
    } finally {
      setAnalysisLoading(false);
    }
  }, [threadId, analysisLoading]);

  // Auto-trigger analysis if we have the data and no analysis exists
  React.useEffect(() => {
    if (!threadAnalysis?.analysis && threadId && userId) {
      handleAnalyzeThread();
    }
  }, [threadAnalysis?.analysis, threadId, userId, handleAnalyzeThread]);

  const parseRawResponse = useCallback((rawResponse: string) => {
    try {
      const cleanedResponse = rawResponse
        .replace(MARKDOWN_CODE_BLOCK_REGEX, '')
        .replace(MARKDOWN_CODE_END_REGEX, '');
      
      const parsed = JSON.parse(cleanedResponse);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.error('Failed to parse raw_response:', error);
      return [];
    }
  }, []);

  // Normalize thread-analysis result to an insight object
  const getThreadInsight = useCallback((result: unknown): unknown => {
    if (!result) return null;
    
    if (typeof result === 'object' && result !== null) {
      const resultObj = result as Record<string, unknown>;
      if (resultObj.insight) return resultObj.insight;
    }
    
    if (Array.isArray(result) && result.length > 0) return result[0];
    return result;
  }, []);

  const extractSummary = useCallback((insight: unknown): string | null => {
    if (!insight || typeof insight !== 'object') return null;
    
    const insightObj = insight as Record<string, unknown>;
    
    // Handle raw_response JSON parsing if present
    if (typeof insightObj.raw_response === 'string') {
      try {
        const cleanedResponse = insightObj.raw_response
          .replace(MARKDOWN_CODE_BLOCK_REGEX, '')
          .replace(MARKDOWN_CODE_END_REGEX, '');
        
        const parsed = JSON.parse(cleanedResponse);
        const insights = Array.isArray(parsed) ? parsed : [parsed];
        
        if (insights.length > 0 && insights[0]?.sourceDetails) {
          const details = insights[0].sourceDetails;
          if (Array.isArray(details)) {
            for (const item of details) {
              if (typeof item === 'string' && item.startsWith('Thread Summary:')) {
                return item.substring('Thread Summary:'.length).trim();
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to parse raw_response JSON:', error);
      }
    }
    
    // Direct summary fields
    if (typeof insightObj.summary === 'string' && insightObj.summary.trim()) {
      return insightObj.summary.trim();
    }
    if (typeof insightObj.threadSummary === 'string' && insightObj.threadSummary.trim()) {
      return insightObj.threadSummary.trim();
    }
    
    // Look into sourceDetails for a summary-like entry
    const details = Array.isArray(insightObj.sourceDetails) ? insightObj.sourceDetails : [];
    for (const item of details) {
      if (typeof item === 'string') {
        const str = item.trim();
        const match = SUMMARY_PREFIXES.find(prefix => 
          str.toLowerCase().startsWith(prefix.toLowerCase())
        );
        if (match) {
          const text = str.substring(match.length).trim();
          if (text) return text;
        }
      } else if (item && typeof item === 'object') {
        const itemObj = item as Record<string, unknown>;
        const label = String(itemObj.label || '').toLowerCase();
        const value = itemObj.value;
        if (label === 'summary' && typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }
    }
    
    return null;
  }, []);

  const handleStartDraft = useCallback((): void => {
    setIsDraftingReply(true);
    onStartDraft?.();
  }, [onStartDraft]);

  const handleCloseDraft = useCallback((): void => {
    setIsDraftingReply(false);
  }, []);

  const handleSendReply = useCallback((content: string): void => {
    console.log('Sending reply:', content);
    setIsDraftingReply(false);
    // TODO: Implement actual reply sending logic
  }, []);

  const handleSaveDraft = useCallback((content: string): void => {
    console.log('Saving draft:', content);
    // TODO: Implement actual draft saving logic
  }, []);

  if (messages.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground text-lg">Conversation Threads</h3>
        <Card className="p-6 text-center">
          <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No conversation threads available</p>
        </Card>
      </div>
    );
  }

  // Get analysis summary for ThreadSummaryCard
  const threadInsight = getThreadInsight(threadAnalysis?.analysis);
  const analysisText = extractSummary(threadInsight);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground text-lg">Conversation Threads</h3>
      
      {/* Thread Summary Card */}
      <ThreadSummaryCard
        partnership={partnership}
        analysisText={analysisText}
        isAnalysisLoading={analysisLoading || threadAnalysis === undefined}
        themeColor={themeColor}
      />
      
      {/* Message List */}
      <MessageList
        messages={messages}
        userEmail={userEmail}
        selectedMessageId={selectedMessageId}
        onMessageSelect={onMessageSelect}
        onStartDraft={handleStartDraft}
        themeColor={themeColor}
      />

      {/* Email Reply Component */}
      {isDraftingReply && emailThreadData && (
        <InlineEmailReply
          isOpen={isDraftingReply}
          onClose={handleCloseDraft}
          onSend={handleSendReply}
          onSaveDraft={handleSaveDraft}
          recipientEmail={emailThreadData.recipientEmail}
          subject={emailThreadData.subject}
          brandName={emailThreadData.brandName}
          emailThreadData={{
            messages: emailThreadData.messages || [],
            subject: emailThreadData.subject || '',
            brandName: emailThreadData.brandName || '',
            recipientEmail: emailThreadData.recipientEmail || ''
          }}
        />
      )}
    </div>
  );
}