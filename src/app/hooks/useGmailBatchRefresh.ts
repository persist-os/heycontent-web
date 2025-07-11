import { useState, useCallback, useRef } from 'react';
import { getApiKey } from '@/app/lib/api-helpers';

export type GmailRefreshStep = 'idle' | 'processing' | 'complete';

interface GmailRefreshProgress {
  step: GmailRefreshStep;
  message: string;
  data?: any;
}

export function useGmailBatchRefresh() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState<GmailRefreshProgress>({
    step: 'idle',
    message: ''
  });
  
  // Global lock to prevent duplicate refreshes
  const isRefreshInProgress = useRef(false);

  const refresh = useCallback(async (options?: {
    max_threads?: number;
  }) => {
    if (isRefreshInProgress.current || loading) {
      console.warn('[GMAIL SMART REFRESH] DUPLICATE REFRESH ATTEMPT BLOCKED!', {
        isRefreshInProgress: isRefreshInProgress.current,
        loading,
        time: new Date().toISOString()
      });
      setError('Gmail refresh already in progress, skipping duplicate call');
      return;
    }
    
    isRefreshInProgress.current = true;
    setLoading(true);
    setError(null);
    setSuccess(false);
    setProgress({ step: 'idle', message: '' });
    
    console.log('[GMAIL SMART REFRESH] ✅ STARTING SMART REFRESH', {
      time: new Date().toISOString(),
      options,
      lockSet: isRefreshInProgress.current
    });

    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        setError('You are not authenticated. Please log in again.');
        setLoading(false);
        isRefreshInProgress.current = false;
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };

      // Set processing state
      setProgress({ 
        step: 'processing', 
        message: 'Analyzing your inbox for new partnership opportunities...' 
      });
      
      // Call the optimized smart-refresh endpoint
      const response = await fetch(`${backendUrl}/api/v1/gmail/smart-refresh`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          max_threads: options?.max_threads || 200
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        // Complete!
        setProgress({ 
          step: 'complete', 
          message: data.message || 'Smart refresh completed successfully!',
          data: data
        });

        setError(null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);

        console.log('[GMAIL SMART REFRESH] ✅ SMART REFRESH COMPLETED SUCCESSFULLY', {
          time: new Date().toISOString(),
          processed: data.processed_count,
          labeled: data.labeled_count,
          stored: data.stored_count,
          learned: data.learned_signals
        });
      } else {
        throw new Error(data.error || 'Smart refresh failed');
      }

    } catch (e: any) {
      console.error('[GMAIL SMART REFRESH] ❌ SMART REFRESH FAILED', {
        error: e.message,
        time: new Date().toISOString()
      });
      setError(e.message || 'Unknown error');
      setProgress({ step: 'idle', message: '' });
    } finally {
      setLoading(false);
      isRefreshInProgress.current = false;
      console.log('[GMAIL SMART REFRESH] 🔓 REFRESH LOCK RELEASED', {
        time: new Date().toISOString()
      });
    }
  }, [loading]);

  // Remove reprocess - it's now integrated into refresh
  return { refresh, loading, error, success, progress };
}
