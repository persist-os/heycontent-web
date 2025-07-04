import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GmailContentItem } from '../types';

export function useGmailAnalytics(userId?: string, refreshCount?: number) {
  const [error, setError] = useState<string | null>(null);

  // Get Gmail accounts to determine connection status
  const gmailAccounts = useQuery(
    api.gmailQueries.getGmailAccounts,
    userId ? { userId } : "skip"
  );

  // Use the raw Convex query that returns the exact schema structure
  const gmailThreads = useQuery(
    api.gmailQueries.listUserGmailThreads,
    userId ? { userId } : "skip"
  );
  
  const loading = gmailThreads === undefined;

  // Map Gmail items according to the actual Convex schema structure
  const mappedGmailItems: GmailContentItem[] = useMemo(() => {
    if (gmailThreads && Array.isArray(gmailThreads)) {
      return gmailThreads.map((thread: any): GmailContentItem => {
        // Extract data from the actual Convex schema structure
        const threadData = thread.data || {};
        const messages = threadData.messages || [];
        
        // Get the first message for basic info
        const firstMessage = messages[0] || {};
        
        // Extract subject, from, snippet from the first message or thread data
        const subject = firstMessage.subject || threadData.subject || thread.subject || 'No Subject';
        const from = firstMessage.from || threadData.from || thread.from || 'Unknown Sender';
        const snippet = firstMessage.snippet || threadData.snippet || thread.snippet || 'No preview available';
        
        // Create unique ID for the thread
        const uniqueId = thread.threadId || thread._id || `gmail-${Date.now()}`;
        
        // Calculate message count
        const messageCount = messages.length || thread.message_count || 1;

        return {
          id: uniqueId,
          platform: 'gmail',
          publishedAt: new Date(thread.createdAt || Date.now()).toISOString(),
          content: {
            data: {
              subject: subject,
              snippet: snippet, 
              from: from,
              emailType: 'individual' as const,
              threadId: thread.threadId,
              emailId: firstMessage.id || thread.threadId,
              messageCount: messageCount,
              messages: messages, // Include full message list
            }
          },
          metrics: {
            replies: Math.max(0, messageCount - 1)
          },
          convexData: thread, // Include the full Convex document
        };
      });
    }
    return [];
  }, [gmailThreads]);

  // Check if user has connected Gmail accounts
  const hasConnectedAccounts = gmailAccounts && gmailAccounts.length > 0;

  return {
    gmailItems: mappedGmailItems,
    loading,
    error,
    hasConnectedAccounts,
    refetch: () => {
      // This will trigger a refetch when called
      console.log('Gmail analytics refetch requested');
    }
  };
} 