import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getApiKey } from '@/app/lib/api-helpers';

export function useGmailInsights(userId?: string) {
  const [error, setError] = useState<string | null>(null);
  const [threadLimit, setThreadLimit] = useState<number | 'all'>(50);
  const [customGmailLimit, setCustomGmailLimit] = useState<string>('');
  const [showGmailCustomInput, setShowGmailCustomInput] = useState(false);

  // Add Gmail-specific queries
  const gmailAccount = useQuery(
    api.gmailQueries.getGmailAccounts,
    userId ? { userId } : "skip"
  );

  // Fetch Gmail insights
  const gmailBatchInsights = useQuery(
    api.gmailQueries.getGmailBatchAnalysis,
    gmailAccount && gmailAccount.length > 0 && userId ? { 
      userId, 
      gmailAccountId: gmailAccount[0].email 
    } : "skip"
  );

  // Store Gmail analysis mutation
  const storeGmailBatchAnalysis = useMutation(api.gmailMutations.storeGmailBatchAnalysis);

  // Platform-specific insights
  const insightsList = gmailBatchInsights?.insights?.insights || [];

  // Determine if batch analysis is currently running based on database status
  const isRunning = gmailBatchInsights?.status?.status === 'processing' || 
                   gmailBatchInsights?.status?.status === 'enqueued' ||
                   gmailBatchInsights?.status?.status === 'running';

  // Check if there's an error in the batch analysis
  const batchError = gmailBatchInsights?.status?.error;

  // Update local error state when batch analysis has an error
  useEffect(() => {
    if (batchError && !error) {
      setError(batchError);
    }
  }, [batchError, error]);

  const refresh = useCallback(async () => {
    if (!userId || !gmailAccount || gmailAccount.length === 0) {
      setError('Gmail account not connected');
      return;
    }

    // Clear any existing errors
    setError(null);
    
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('You are not authenticated. Please log in again.');
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/api/v1/gmail/account-insights`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          user_id: userId,
          gmail_account_id: gmailAccount[0].email,
          max_threads: threadLimit === 'all' ? 1000 : threadLimit,
          max_messages: 100,
          include_spam_analysis: true,
          force_refresh: true,
          analysis_mode: "individual"
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.status === 'enqueued') {
        // Gmail analysis is now async - the status is tracked in the database
        // The results will be automatically available in the query once completed
        console.log(`Gmail analysis enqueued with task ID: ${data.task_id}`);
      } else if (data.status === 'success') {
        // Handle legacy synchronous response (if any)
        await storeGmailBatchAnalysis({
          userId,
          gmailAccountId: gmailAccount[0].email,
          insights: data.data
        });
      } else {
        throw new Error(data.error || 'Failed to refresh Gmail insights');
      }
    } catch (error: any) {
      console.error('Error refreshing Gmail insights:', error);
      setError(error.message || 'Failed to refresh Gmail insights');
    }
  }, [userId, gmailAccount, threadLimit, storeGmailBatchAnalysis]);

  const handleCustomSubmit = useCallback(() => {
    const customValue = parseInt(customGmailLimit);
    if (customValue && customValue > 0 && customValue <= 1000) {
      setThreadLimit(customValue);
      setShowGmailCustomInput(false);
      setCustomGmailLimit('');
    }
  }, [customGmailLimit]);

  return {
    insights: insightsList,
    loading: gmailBatchInsights === undefined,
    refreshing: isRunning, // Use database status instead of local state
    error,
    isConnected: !!(gmailAccount && gmailAccount.length > 0),
    refresh,
    account: gmailAccount,
    // Thread limit controls
    threadLimit,
    setThreadLimit,
    customGmailLimit,
    setCustomGmailLimit,
    showGmailCustomInput,
    setShowGmailCustomInput,
    handleCustomSubmit
  };
} 