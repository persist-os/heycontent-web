import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getApiKey } from '@/app/lib/api-helpers';
import { BatchAnalysisHookReturn, InsightCard } from '@/types/batch-analysis';

export function useGmailInsights(userId?: string): BatchAnalysisHookReturn {
  const [error, setError] = useState<string | null>(null);
  const [threadLimit, setThreadLimit] = useState<number | 'all'>(5);
  const [customGmailLimit, setCustomGmailLimit] = useState<string>('');
  const [showGmailCustomInput, setShowGmailCustomInput] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add Gmail-specific queries
  const gmailAccount = useQuery(
    api.gmailQueries.getGmailAccounts,
    userId ? { userId } : "skip"
  );

  // Memoize the accountId to avoid unnecessary re-renders
  const gmailAccountId = useMemo(
    () => (gmailAccount && gmailAccount.length > 0 ? gmailAccount[0].email : undefined),
    [gmailAccount]
  );

  // Fetch Gmail batch analysis insights
  const gmailInsights = useQuery(
    api.gmailQueries.getGmailBatchAnalysis,
    userId && gmailAccountId ? { 
      userId, 
      gmailAccountId
    } : "skip"
  );

  // Store Gmail batch analysis mutation
  const storeGmailBatchAnalysis = useMutation(api.gmailMutations.storeGmailBatchAnalysis);

  // Check if insights is the universal format object (with insights, metadata, status)
  const rawInsights = gmailInsights?.insights;
  const isUniversalFormat = rawInsights && typeof rawInsights === 'object' && 'insights' in rawInsights;
  
  const insightsList: InsightCard[] = isUniversalFormat 
    ? (rawInsights as any).insights || []
    : rawInsights || [];
  const metadata = isUniversalFormat 
    ? (rawInsights as any).metadata || null
    : (gmailInsights as any)?.metadata || null;
  const status = isUniversalFormat 
    ? (rawInsights as any).status || null
    : gmailInsights?.status || null;
    
  // Only show as running if we're actively refreshing AND status is processing/enqueued
  // Don't auto-show loading for old stuck statuses
  // Check both root-level status (updated by mutations) and nested status (from insights)
  const rootStatus = gmailInsights?.status?.status;
  const nestedStatus = status?.status;
  const databaseStatus = rootStatus || nestedStatus;
  
  // Extract progress from the correct status object
  // Priority: root-level status (current) > nested status (cached)
  const currentProgress = gmailInsights?.status?.progress !== undefined 
    ? gmailInsights.status.progress 
    : status?.progress || 0;
  
  // Fix: Handle race condition between local refresh state and database updates
  // When user clicks refresh, show refreshing state immediately, even if database hasn't updated yet
  // Once database status updates to processing/enqueued, continue showing refreshing state
  const isActuallyRunning = isRefreshing || databaseStatus === 'processing' || databaseStatus === 'enqueued' || databaseStatus === 'running';
  
  // Check if there's an error in the batch analysis
  const batchError = status?.error;

  // Update local error state when batch analysis has an error
  useEffect(() => {
    if (batchError && !error) {
      setError(batchError);
    }
  }, [batchError, error]);

  // Reset local refreshing state when task completes or database state becomes definitive
  useEffect(() => {
    if (isRefreshing && databaseStatus) {
      if (databaseStatus === 'completed' || databaseStatus === 'failed') {
        // Task definitively finished - clear local state
        setIsRefreshing(false);
      } else if (databaseStatus === 'processing' || databaseStatus === 'enqueued' || databaseStatus === 'running') {
        // Database caught up with our refresh request - database now drives the state
      }
    }
  }, [isRefreshing, databaseStatus]);

  const refresh = useCallback(async () => {
    if (!userId || !gmailAccount || gmailAccount.length === 0) {
      setError('Gmail account not connected');
      return;
    }

    // Prevent multiple concurrent refresh attempts
    if (isRefreshing || databaseStatus === 'processing' || databaseStatus === 'enqueued' || databaseStatus === 'running') {
      return;
    }

    setIsRefreshing(true);
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
          max_threads: typeof threadLimit === 'number' ? Math.min(threadLimit, 20) : 5, // Enforce hard limit of 20
          max_messages: 100,
          include_spam_analysis: true,
          force_refresh: false, // Don't force refresh to avoid unnecessary API calls
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
      } else if (data.status === 'success') {
        // Handle legacy synchronous response (if any)
        await storeGmailBatchAnalysis({
          userId,
          gmailAccountId: gmailAccount[0].email,
          insights: data.data
        });
        setIsRefreshing(false);
      } else {
        throw new Error(data.error || 'Failed to refresh Gmail insights');
      }
    } catch (error: any) {
      console.error('Error refreshing Gmail insights:', error);
      setError(error.message || 'Failed to refresh Gmail insights');
      setIsRefreshing(false);
    }
  }, [userId, gmailAccount, threadLimit, storeGmailBatchAnalysis]);

  const handleCustomSubmit = useCallback(() => {
    const limit = parseInt(customGmailLimit, 10);
    // Enforce hard limit of 20 threads
    if (!isNaN(limit) && limit > 0 && limit <= 20) {
      setThreadLimit(limit);
      setShowGmailCustomInput(false);
    }
  }, [customGmailLimit]);

  return {
    insights: insightsList,
    metadata,
    status: {
      ...status,
      progress: currentProgress // Use the correct progress value
    },
    loading: gmailInsights === undefined,
    refreshing: isActuallyRunning, // Use combined local + database state
    error,
    isConnected: !!(gmailAccount && gmailAccount.length > 0),
    refresh,
    account: gmailAccount,
    postLimit: threadLimit,
    setPostLimit: setThreadLimit,
    customPostLimit: customGmailLimit,
    setCustomPostLimit: setCustomGmailLimit,
    showCustomInput: showGmailCustomInput,
    setShowCustomInput: setShowGmailCustomInput,
    handleCustomSubmit,
  };
} 