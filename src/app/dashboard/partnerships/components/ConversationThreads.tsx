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
import { ThreadAnalysisPanel } from './ThreadAnalysisPanel';
import { MessageList } from './MessageList';

// Constants
const ANIMATION_DURATION = '2s';
const ANIMATION_TIMING = 'ease-in-out infinite';
const LOADING_SKELETON_WIDTHS = ['w-4/5', 'w-3/4', 'w-1/2'] as const;

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

  // Get theme color hex value for components that need raw hex colors
  const getThemeColorHex = (color: string): string => {
    const colors = {
      purple: '#9D89F7',    // Partnership
      pink: '#FF96FB',      // Media
      teal: '#40E3FF',      // Business  
      green: '#9BE7B2',     // Community
      yellow: '#FFDF39'     // Default/Uncategorized - HeyContent Yellow
    };
    return colors[color as keyof typeof colors] || colors.yellow;
  };

  const themeColorHex = getThemeColorHex(themeColor);

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
      const response = await fetchWithApiKey('/api/social/gmail/thread-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId
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

  // Debug log to see the structure of threadAnalysis
  React.useEffect(() => {
    if (threadAnalysis && process.env.NODE_ENV === 'development') {
      console.log('🔍 [DEBUG] ThreadAnalysis structure:', {
        keys: Object.keys(threadAnalysis),
        hasAnalysis: !!threadAnalysis.analysis,
        hasInsight: !!(threadAnalysis as any).insight,
        threadId,
        userId
      });
    }
  }, [threadAnalysis, threadId, userId]);

  const parseRawResponse = useCallback((rawResponse: string) => {
    try {
      const cleanedResponse = rawResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*$/g, '');
      
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

  // Get analysis data for ThreadAnalysisPanel
  const threadInsight = getThreadInsight(threadAnalysis?.analysis);
  const analysisData = threadInsight as any;

  return (
    <div className="space-y-4">
      {/* AI Analysis Panel */}
      <ThreadAnalysisPanel
        analysisData={analysisData}
        isAnalysisLoading={analysisLoading}
        onAnalyzeThread={handleAnalyzeThread}
        themeColor={themeColor}
      />
      
      <h3 className="font-semibold text-foreground text-lg">Conversation Threads</h3>
      
      {/* Conversation Threads - Individual Messages */}
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
          themeColor={themeColorHex}
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