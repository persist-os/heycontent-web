import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getApiKey } from '@/app/lib/api-helpers';
import { BatchAnalysisHookReturn, InsightCard } from '@/types/batch-analysis';

export function useGmailInsights(userId?: string): BatchAnalysisHookReturn {
  const [error, setError] = useState<string | null>(null);
  const [threadLimit, setThreadLimit] = useState<number | 'all'>(50);
  const [customGmailLimit, setCustomGmailLimit] = useState<string>('');
  const [showGmailCustomInput, setShowGmailCustomInput] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add Gmail-specific queries
  const gmailAccount = useQuery(
    api.gmailQueries.getGmailAccounts,
    userId ? { userId } : "skip"
  );

  // Fetch Gmail batch analysis insights
  const gmailInsights = useQuery(
    api.gmailQueries.getGmailBatchAnalysis,
    userId && gmailAccount && gmailAccount.length > 0 ? { 
      userId, 
      gmailAccountId: gmailAccount[0].email 
    } : "skip"
  );

  // Store Gmail batch analysis mutation
  const storeGmailBatchAnalysis = useMutation(api.gmailMutations.storeGmailBatchAnalysis);

  // Extract data - handle both old and new formats during transition
  console.log('[useGmailInsights] Raw Convex data:', gmailInsights);
  console.log('[useGmailInsights] gmailInsights?.insights:', gmailInsights?.insights);
  console.log('[useGmailInsights] Type of gmailInsights?.insights:', typeof gmailInsights?.insights);
  console.log('[useGmailInsights] Is array?', Array.isArray(gmailInsights?.insights));
  
  // Check if insights is the universal format object (with insights, metadata, status)
  const rawInsights = gmailInsights?.insights;
  const isUniversalFormat = rawInsights && typeof rawInsights === 'object' && 'insights' in rawInsights;
  
  console.log('[useGmailInsights] Is universal format?', isUniversalFormat);
  
  const insightsList: InsightCard[] = isUniversalFormat 
    ? (rawInsights as any).insights || []
    : rawInsights || [];
  const metadata = isUniversalFormat 
    ? (rawInsights as any).metadata || null
    : (gmailInsights as any)?.metadata || null;
  const status = isUniversalFormat 
    ? (rawInsights as any).status || null
    : gmailInsights?.status || null;
    
  console.log('[useGmailInsights] Extracted insightsList:', insightsList);
  console.log('[useGmailInsights] Extracted metadata:', metadata);
  console.log('[useGmailInsights] Extracted status:', status);

  // Only show as running if we're actively refreshing AND status is processing/enqueued
  // Don't auto-show loading for old stuck statuses
  // Check both root-level status (updated by mutations) and nested status (from insights)
  const rootStatus = gmailInsights?.status?.status;
  const nestedStatus = status?.status;
  const databaseStatus = rootStatus || nestedStatus;
  
  // Fix: Handle race condition between local refresh state and database updates
  // When user clicks refresh, show refreshing state immediately, even if database hasn't updated yet
  // Once database status updates to processing/enqueued, continue showing refreshing state
  const isActuallyRunning = isRefreshing || databaseStatus === 'processing' || databaseStatus === 'enqueued' || databaseStatus === 'running';
  
  console.log('[useGmailInsights] Refresh state debug:', {
    localIsRefreshing: isRefreshing,
    rootStatus,
    nestedStatus,
    databaseStatus,
    isActuallyRunning,
    status: status,
    rootStatusObject: gmailInsights?.status,
    hasAccount: !!(gmailAccount && gmailAccount.length > 0),
    hasInsights: !!insightsList?.length
  });

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
        console.log('[useGmailInsights] Task completed/failed, clearing local refresh state');
        setIsRefreshing(false);
      } else if (databaseStatus === 'processing' || databaseStatus === 'enqueued' || databaseStatus === 'running') {
        // Database caught up with our refresh request - database now drives the state
        console.log('[useGmailInsights] Database status updated to active, local state can continue');
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
      console.log('[useGmailInsights] Refresh already in progress, ignoring click', {
        isRefreshing,
        databaseStatus,
        currentTime: new Date().toISOString()
      });
      return;
    }

    console.log('[useGmailInsights] Starting refresh...', {
      userId,
      hasAccount: !!(gmailAccount && gmailAccount.length > 0),
      threadLimit,
      currentTime: new Date().toISOString()
    });

    // Set local refreshing state
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
          max_threads: threadLimit === 'all' ? 1000 : threadLimit,
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
        console.log(`✅ Gmail analysis enqueued with task ID: ${data.task_id}`);
        console.log('[useGmailInsights] Task enqueued, keeping local refresh state until database updates');
        // Keep refreshing state until task completes - database will update via real-time subscription
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
    if (!isNaN(limit) && limit > 0) {
      setThreadLimit(limit);
      setShowGmailCustomInput(false);
    }
  }, [customGmailLimit]);

  return {
    insights: insightsList,
    metadata,
    status,
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