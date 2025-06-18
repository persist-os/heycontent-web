import { useState, useMemo } from 'react';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GmailContentItem } from '../types';

export function useGmailAnalytics(userId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convex query for Gmail threads
  const gmailThreads = useQuery(
    api.gmailQueries.getGmailThreadsWithMessages,
    userId ? { userId } : "skip"
  );

  // Helper to get the received date for an email/thread
  const getReceivedDate = (email: any, thread: any) => {
    if (email && email.internalDate) return new Date(Number(email.internalDate)).toISOString();
    const firstMessage = thread.messages && thread.messages.length > 0 ? thread.messages[0] : null;
    if (firstMessage && firstMessage.internalDate) return new Date(Number(firstMessage.internalDate)).toISOString();
    if (thread.createdAt) return new Date(thread.createdAt).toISOString();
    return '';
  };

  // Map Gmail items
  const mappedGmailItems = useMemo(() => {
    if (Array.isArray(gmailThreads)) {
      const importantEmails: any[] = [];
      gmailThreads.forEach((thread: any, threadIndex: number) => {
        if (thread.analysis && Array.isArray(thread.analysis.important_emails)) {
          thread.analysis.important_emails.forEach((email: any, emailIndex: number) => {
            const firstMessage = thread.messages && thread.messages.length > 0 ? thread.messages[0] : null;
            // Ensure unique ID by prefixing with 'important-' and including indices
            const uniqueId = `gmail-important-${thread.threadId || thread._id || thread.id}-${emailIndex}`;
            importantEmails.push({
              id: uniqueId,
              platform: 'gmail',
              publishedAt: getReceivedDate(email, thread),
              content: {
                data: {
                  subject: email.subject || thread.data?.subject || thread.subject || 'No Subject',
                  snippet: email.snippet || thread.data?.snippet || thread.snippet || 'No preview available',
                  from: email.sender || thread.data?.from || thread.from || 'Unknown Sender',
                  emailType: email.emailType || 'important',
                  threadId: thread.threadId,
                  emailId: firstMessage?.messageId || firstMessage?.id,
                }
              },
              metrics: email.metrics || {},
            });
          });
        }
      });
      if (importantEmails.length > 0) return importantEmails;
      
      // Use the enhanced data structure from getGmailThreadsWithMessages
      return gmailThreads.map((thread: any, index: number): GmailContentItem => {
        // Handle different data structures:
        // 1. thread.data.messages[0] (for gmailThreads with messages array)
        // 2. thread.data (for individual gmailMessages)
        // 3. Direct thread properties (fallback)
        
        let emailData = null;
        
        // Check if thread has data.messages array (from gmailThreads)
        if (thread.data?.messages && Array.isArray(thread.data.messages) && thread.data.messages.length > 0) {
          emailData = thread.data.messages[0]; // Get first message from thread
        }
        // Check if thread.data has direct email properties (from gmailMessages)
        else if (thread.data?.subject || thread.data?.from) {
          emailData = thread.data;
        }
        // Fallback to thread.messages if available
        else if (thread.messages && Array.isArray(thread.messages) && thread.messages.length > 0) {
          emailData = thread.messages[0];
        }
        
        // Extract data with proper fallbacks
        const subject = emailData?.subject || 
                       thread.subject || 
                       'No Subject';
                       
        const snippet = emailData?.snippet || 
                       emailData?.body || // Sometimes body contains the snippet
                       thread.snippet || 
                       'No preview available';
                       
        const from = emailData?.from || 
                    thread.from || 
                    'Unknown Sender';
                    
        // Get thread ID and message count
        const threadId = thread.threadId || thread.data?.threadId || thread.data?.id || thread._id;
        const messageCount = thread.data?.messages?.length || thread.messages?.length || 1;
        
        // Ensure unique ID
        const uniqueId = `gmail-${threadId || `thread-${thread._id || thread.id || index}`}`;
        
        return {
          id: uniqueId,
          platform: 'gmail',
          publishedAt: getReceivedDate(emailData, thread),
          content: {
            data: {
              subject: subject,
              snippet: snippet, 
              from: from,
              emailType: emailData?.emailType || 'all',
              threadId: threadId,
              emailId: emailData?.messageId || emailData?.id || threadId,
              messageCount: messageCount,
              messages: thread.data?.messages || thread.messages || [],
            }
          },
          metrics: thread.metrics || { replies: Math.max(0, messageCount - 1) },
        };
      });
    }
    return [];
  }, [gmailThreads]);

  return {
    items: mappedGmailItems,
    loading: gmailThreads === undefined,
    error,
    isConnected: !!gmailThreads,
    rawData: gmailThreads
  };
} 