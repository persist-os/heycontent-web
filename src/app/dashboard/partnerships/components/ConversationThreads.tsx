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
  readonly from?: string;
  readonly subject?: string;
  readonly brandName?: string;
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
  onStartDraft
}: ConversationThreadsProps) {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [isDraftingReply, setIsDraftingReply] = useState(false);

  // Convex queries for analysis
  const threadAnalysis = useQuery(
    api.gmailQueries.getGmailThreadByThreadId,
    { userId, threadId }
  );

  // Auto-expand the most recent message when messages change
  React.useEffect(() => {
    if (messages.length > 0) {
      // Find the most recent message (highest timestamp)
      const mostRecentMessage = messages.reduce((latest, current) => 
        current.timestamp > latest.timestamp ? current : latest
      );
      
      // Expand the most recent message by default
      setExpandedMessages(new Set([mostRecentMessage.id]));
    }
  }, [messages]);

  const toggleMessageExpansion = (messageId: string) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMessages(newExpanded);
  };

  const formatTimestamp = useCallback((timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', DATE_FORMAT_OPTIONS);
  }, []);

  const getSenderDisplay = useCallback((message: EmailMessage): string => {
    return message.isFromUser ? 'Me' : message.from;
  }, []);

  const getSenderEmail = useCallback((message: EmailMessage): string => {
    return message.isFromUser ? (userEmail || 'me@example.com') : message.email;
  }, [userEmail]);

  const getMessageBackground = useCallback((message: EmailMessage, isSelected: boolean): string => {
    if (isSelected) return 'bg-primary/20 border-primary/30';
    if (message.isFromUser) return 'bg-primary/10 border-primary/20';
    return 'bg-muted/50 border-border';
  }, []);

  // Analysis functions
  const handleAnalyzeThread = useCallback(async (): Promise<void> => {
    setAnalysisLoading(true);
    
    try {
      const response = await fetchWithApiKey('/api/social/gmail/thread-analysis', {
        method: 'POST',
        body: JSON.stringify({ userId, threadId })
      });
      
      if (!response.ok) {
        throw new Error(`Analysis request failed: ${response.status}`);
      }
      
      await response.json();
      console.log('Analysis generated and stored in Convex for thread:', threadId);
      // Note: The backend automatically stores the result in Convex
      // The threadAnalysis query will automatically update due to Convex reactivity
    } catch (error) {
      console.error('Error analyzing thread:', error);
      // TODO: Add user-facing error handling
    } finally {
      setAnalysisLoading(false);
    }
  }, [userId, threadId]);

  // Auto-trigger thread analysis when thread changes and no analysis exists
  React.useEffect(() => {
    if (analysisLoading || threadAnalysis === undefined) return;
    
    const hasConvexAnalysis = threadAnalysis?.analysis;
    
    if (!hasConvexAnalysis) {
      console.log('No analysis found in Convex for thread:', threadId, '- generating new analysis');
      handleAnalyzeThread();
    } else {
      console.log('Using existing analysis from Convex for thread:', threadId);
    }
  }, [threadId, threadAnalysis, analysisLoading, handleAnalyzeThread]);

  // Helper function to parse raw_response JSON
  const parseRawResponse = useCallback((rawResponse: string): unknown[] => {
    try {
      let cleanedResponse = rawResponse
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

  // Helper functions for summary card
  const formatTimeAgo = useCallback((timestamp: number): string => {
    const now = Date.now();
    const diffInMs = now - timestamp;
    const diffInHours = diffInMs / HOURS_IN_MS;
    const diffInDays = diffInHours / HOURS_IN_DAY;
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < HOURS_IN_DAY) return `${Math.floor(diffInHours)}h ago`;
    if (diffInDays < DAYS_IN_WEEK) return `${Math.floor(diffInDays)}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  }, []);

  const formatValue = useCallback((value: number): string => {
    if (value === 0) return 'Not specified';
    if (value >= MILLION) return `$${(value / MILLION).toFixed(1)}M`;
    if (value >= THOUSAND) return `$${(value / THOUSAND).toFixed(1)}K`;
    return `$${value}`;
  }, []);

  // Draft reply handlers
  const handleStartDraft = useCallback((): void => {
    setIsDraftingReply(true);
    onStartDraft?.();
  }, [onStartDraft]);

  const handleCloseDraft = useCallback((): void => {
    setIsDraftingReply(false);
  }, []);

  const handleSendReply = useCallback((replyData: unknown): void => {
    console.log('Sending reply:', replyData);
    setIsDraftingReply(false);
    // TODO: Implement actual reply sending logic
  }, []);

  const handleSaveDraft = useCallback((draftData: unknown): void => {
    console.log('Saving draft:', draftData);
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

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground text-lg">Conversation Threads</h3>
      
      {/* Email Thread Summary */}
      {partnership && (
        <Card className="p-4 rounded-xl shadow-none border border-purple-200 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground text-sm md:text-base">
              Summary
            </h3>
          </div>
          
          <div className="flex items-center gap-4 text-sm mt-2">
            <div className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-1 text-muted-foreground" />
              <span className="text-foreground">Messages: {partnership.messageCount}</span>
            </div>
            
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
              <span className="text-foreground">Last Activity: {formatTimeAgo(partnership.lastActivity)}</span>
            </div>
            
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-1 text-muted-foreground" />
              <span className="text-foreground font-medium">Estimated Value: {formatValue(partnership.estimatedValue)}</span>
            </div>
          </div>

          {/* Thread Analysis Summary */}
          <div className="mt-3">
            {(() => {
              // Show loading if analysis is being generated or Convex query is loading
              if (analysisLoading || threadAnalysis === undefined) {
                return (
                  <div className="space-y-2">
                    {LOADING_SKELETON_WIDTHS.map((width, index) => (
                      <div 
                        key={index}
                        className={`h-3 bg-purple-200/50 dark:bg-purple-800/30 rounded ${width}`} 
                        style={{
                          animation: `subtle-pulse ${ANIMATION_DURATION} ${ANIMATION_TIMING}`,
                          transformOrigin: 'left'
                        }}
                      />
                    ))}
                    <style jsx>{`
                      @keyframes subtle-pulse {
                        0%, 100% { opacity: 0.3; transform: scaleX(1); }
                        50% { opacity: 0.6; transform: scaleX(1.02); }
                      }
                    `}</style>
                  </div>
                );
              }

              // Only use Convex analysis - no local state fallback
              const threadInsight = getThreadInsight(threadAnalysis?.analysis);
              const summary = extractSummary(threadInsight);
              
              return summary ? (
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {summary}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Generating analysis...
                </div>
              );
            })()}
          </div>
        </Card>
      )}
      
      <div className="space-y-2">
        {messages.map((message, index) => {
          const isExpanded = expandedMessages.has(message.id);
          const isSelected = selectedMessageId === message.id;
          
          return (
            <div key={message.id} className="space-y-1">
              {/* Single Card with Header and Optional Body */}
              <div 
                className={`rounded-xl border transition-colors cursor-pointer ${getMessageBackground(message, isSelected)}`}
                onClick={() => {
                  toggleMessageExpansion(message.id);
                  onMessageSelect?.(message.id);
                }}
              >
                {/* Header Section - Always Purple Background */}
                <div className="flex items-center justify-between p-3 bg-primary/10 border-b border-primary/20 rounded-t-xl">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {message.isFromUser ? (
                        <User className="w-4 h-4 text-primary" />
                      ) : (
                        <Mail className="w-4 h-4 text-primary" />
                      )}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-sm truncate">
                            {getSenderDisplay(message)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            &lt;{getSenderEmail(message)}&gt;
                          </span>
                        </div>
                        {message.subject && (
                          <p className="text-xs text-muted-foreground truncate">
                            {message.subject}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Message Content - Card Background */}
                {isExpanded && (
                  <div className="p-4 bg-card rounded-b-xl">
                    <div className="prose prose-sm max-w-none text-card-foreground">
                      <div className="text-sm leading-relaxed break-words overflow-wrap-anywhere whitespace-pre-wrap text-card-foreground">
                        {message.body}
                      </div>
                    </div>
                    
                    {/* Message Actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(message.timestamp)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {message.isReply && (
                          <Badge variant="outline" className="text-xs">
                            Reply
                          </Badge>
                        )}
                        {message.isFromUser && (
                          <Badge variant="outline" className="text-xs">
                            Sent
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Draft Reply Button */}
                    <div className="mt-4 flex justify-start">
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartDraft();
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        size="sm"
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        Draft Reply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline Email Reply */}
      {isDraftingReply && partnership && emailThreadData?.messages && (
        <div className="mt-4 border-t border-border pt-4">
          <InlineEmailReply
            isOpen={isDraftingReply}
            onClose={handleCloseDraft}
            onSend={handleSendReply}
            onSaveDraft={handleSaveDraft}
            emailThreadData={{
              messages: emailThreadData.messages,
              subject: emailThreadData.subject || partnership.subject || '',
              brandName: emailThreadData.brandName || partnership.brandName || '',
              recipientEmail: emailThreadData.recipientEmail || partnership.from || ''
            }}
            recipientEmail={partnership.from}
            subject={partnership.subject}
            brandName={partnership.brandName}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
} 