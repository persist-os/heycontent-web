'use client'

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { getCurrentUserId, fetchWithApiKey } from '@/app/lib/api-helpers';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { InlineEmailReply } from './InlineEmailReply';

interface EmailMessage {
  id: string;
  from: string;
  email: string;
  subject: string;
  body: string;
  timestamp: number;
  isReply: boolean;
  isFromUser: boolean;
}

interface ConversationThreadsProps {
  messages: EmailMessage[];
  userEmail?: string | null;
  onMessageSelect?: (messageId: string) => void;
  selectedMessageId?: string;
  onStartDraft?: () => void;
  threadId?: string; // Gmail thread ID for analysis
  userId?: string; // User ID for Convex queries
  gmailAccountId?: string; // Gmail account for batch analysis
  // Partnership data for summary card
  partnership?: {
    messageCount: number;
    lastActivity: number;
    estimatedValue: number;
    from?: string;
    subject?: string;
    brandName?: string;
  };
  // Email thread data for InlineEmailReply
  emailThreadData?: any;
}

export function ConversationThreads({ 
  messages, 
  userEmail, 
  onMessageSelect,
  selectedMessageId,
  onStartDraft,
  threadId,
  userId,
  gmailAccountId,
  partnership,
  emailThreadData
}: ConversationThreadsProps) {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isDraftingReply, setIsDraftingReply] = useState(false);

  // Convex queries for analysis
  const threadAnalysis = useQuery(
    api.gmailQueries.getGmailThreadByThreadId,
    userId && threadId ? { userId, threadId } : "skip"
  );

  const batchAnalysis = useQuery(
    api.gmailQueries.getGmailBatchAnalysis,
    userId && gmailAccountId ? { userId, gmailAccountId } : "skip"
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

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSenderDisplay = (message: EmailMessage) => {
    if (message.isFromUser) {
      return 'Me';
    }
    return message.from;
  };

  const getSenderEmail = (message: EmailMessage) => {
    if (message.isFromUser) {
      return userEmail || 'me@example.com';
    }
    return message.email;
  };

  const getMessageBackground = (message: EmailMessage, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-primary/20 border-primary/30';
    }
    if (message.isFromUser) {
      return 'bg-primary/10 border-primary/20';
    }
    return 'bg-muted/50 border-border';
  };

  // Analysis functions
  const handleAnalyzeThread = async () => {
    if (!threadId || !userId) return;
    
    setAnalysisLoading(true);
    setAnalysisResult(null);
    
    try {
      const response = await fetchWithApiKey('/api/social/gmail/thread-analysis', {
        method: 'POST',
        body: JSON.stringify({
          userId: userId,
          threadId: threadId
        })
      });
      
      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error analyzing thread:', error);
      setAnalysisResult({ error: 'Failed to analyze thread' });
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Auto-trigger thread analysis when thread changes and no analysis exists
  React.useEffect(() => {
    if (!threadId || !userId || analysisLoading) return;
    
    // Wait for Convex query to complete before making decisions
    if (threadAnalysis === undefined) {
      return;
    }
    
    // Check if we have analysis from Convex first
    const hasConvexAnalysis = threadAnalysis?.analysis;
    const hasLocalAnalysis = !!analysisResult && (analysisResult.insight || (Array.isArray(analysisResult) && analysisResult.length > 0));
    
    // Only call backend if no analysis exists anywhere (Convex or local)
    const shouldAnalyze = !hasConvexAnalysis && !hasLocalAnalysis;
    
    if (shouldAnalyze) {
      handleAnalyzeThread();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, userId, threadAnalysis]);

  // Helper function to parse raw_response JSON
  const parseRawResponse = (rawResponse: string) => {
    try {
      let cleanedResponse = rawResponse;
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '');
      cleanedResponse = cleanedResponse.replace(/```\s*$/g, '');
      const parsed = JSON.parse(cleanedResponse);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.error('Failed to parse raw_response:', error);
      return [];
    }
  };

  // Normalize thread-analysis result to an insight object
  const getThreadInsight = (result: any) => {
    if (!result) return null;
    if (result.insight) return result.insight;
    if (Array.isArray(result) && result.length > 0) return result[0];
    return result;
  };

  const extractSummary = (insight: any): string | null => {
    if (!insight) return null;
    
    // Handle raw_response JSON parsing if present
    if (insight.raw_response) {
      try {
        let cleanedResponse = insight.raw_response;
        cleanedResponse = cleanedResponse.replace(/```json\s*/g, '');
        cleanedResponse = cleanedResponse.replace(/```\s*$/g, '');
        
        const parsed = JSON.parse(cleanedResponse);
        const insights = Array.isArray(parsed) ? parsed : [parsed];
        
        if (insights.length > 0 && insights[0].sourceDetails) {
          const details = insights[0].sourceDetails;
          for (const item of details) {
            if (typeof item === 'string' && item.startsWith('Thread Summary:')) {
              return item.substring('Thread Summary:'.length).trim();
            }
          }
        }
      } catch (error) {
        console.error('Failed to parse raw_response JSON:', error);
      }
    }
    
    // Direct summary fields
    if (typeof insight.summary === 'string' && insight.summary.trim()) {
      return insight.summary.trim();
    }
    if (typeof insight.threadSummary === 'string' && insight.threadSummary.trim()) {
      return insight.threadSummary.trim();
    }
    
    // Look into sourceDetails for a summary-like entry
    const details = Array.isArray(insight.sourceDetails) ? insight.sourceDetails : [];
    if (details.length > 0) {
      for (const item of details) {
        if (typeof item === 'string') {
          const str = item.trim();
          const prefixes = ['Thread Summary:', 'Summary:', 'TL;DR:', 'TLDR:'];
          const match = prefixes.find(p => str.toLowerCase().startsWith(p.toLowerCase()));
          if (match) {
            const text = str.substring(match.length).trim();
            if (text) return text;
          }
        } else if (item && typeof item === 'object') {
          const label = String((item as any).label || '').toLowerCase();
          const value = (item as any).value;
          if (label === 'summary' && typeof value === 'string' && value.trim()) {
            return value.trim();
          }
        }
      }
    }
    return null;
  };

  // Helper functions for summary card
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffInMs = now - timestamp;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  const formatValue = (value: number) => {
    if (value === 0) return 'Not specified';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value}`;
  };

  // Draft reply handlers
  const handleStartDraft = () => {
    setIsDraftingReply(true);
    onStartDraft?.();
  };

  const handleCloseDraft = () => {
    setIsDraftingReply(false);
  };

  const handleSendReply = (replyData: any) => {
    // Handle reply sending logic here
    console.log('Sending reply:', replyData);
    setIsDraftingReply(false);
  };

  const handleSaveDraft = (draftData: any) => {
    // Handle draft saving logic here
    console.log('Saving draft:', draftData);
  };

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
              // Show loading if analysis is loading and no Convex analysis exists
              if ((analysisLoading && !threadAnalysis?.analysis) || (threadAnalysis === undefined && threadId)) {
                return (
                  <div className="space-y-2">
                    <div className="h-3 bg-purple-200/50 dark:bg-purple-800/30 rounded w-4/5" style={{
                      animation: 'subtle-pulse 2s ease-in-out infinite',
                      transformOrigin: 'left'
                    }}></div>
                    <div className="h-3 bg-purple-200/50 dark:bg-purple-800/30 rounded w-3/4" style={{
                      animation: 'subtle-pulse 2s ease-in-out infinite',
                      transformOrigin: 'left'
                    }}></div>
                    <div className="h-3 bg-purple-200/50 dark:bg-purple-800/30 rounded w-1/2" style={{
                      animation: 'subtle-pulse 2s ease-in-out infinite',
                      transformOrigin: 'left'
                    }}></div>
                    <style jsx>{`
                      @keyframes subtle-pulse {
                        0%, 100% { opacity: 0.3; transform: scaleX(1); }
                        50% { opacity: 0.6; transform: scaleX(1.02); }
                      }
                    `}</style>
                  </div>
                );
              }

              // Use Convex analysis first, fallback to local analysis result
              const threadInsight = getThreadInsight(threadAnalysis?.analysis || analysisResult);
              const summary = extractSummary(threadInsight);
              
              if (!summary) {
                return (
                  <div className="text-xs text-muted-foreground">
                    {threadId ? 'No analysis available' : 'Select a thread to see analysis'}
                  </div>
                );
              }
              
              return (
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {summary}
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
      {isDraftingReply && partnership && emailThreadData && (
        <div className="mt-4 border-t border-border pt-4">
          <InlineEmailReply
            isOpen={isDraftingReply}
            onClose={handleCloseDraft}
            onSend={handleSendReply}
            onSaveDraft={handleSaveDraft}
            emailThreadData={emailThreadData}
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