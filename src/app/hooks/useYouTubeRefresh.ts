import { useState, useCallback } from 'react';
import { getApiKey } from '@/app/lib/api-helpers';

export function useYouTubeRefresh() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const refresh = useCallback(async (videoId: string, videoUrl: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    console.log('YouTube Refresh: Starting refresh for', { videoId, videoUrl });
    
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        const errorMsg = 'You are not authenticated. Please log in again.';
        console.error('YouTube Refresh: Authentication failed', errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }
      
      console.log('YouTube Refresh: Making API request...');
      const res = await fetch('/api/social/youtube/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ videoId, videoUrl }),
      });
      
      console.log('YouTube Refresh: API response status:', res.status);
      
      const data = await res.json();
      console.log('YouTube Refresh: API response data:', data);
      
      if (!res.ok || data.status !== 'success') {
        const errorMsg = data.error || `Failed to refresh video (Status: ${res.status})`;
        console.error('YouTube Refresh: API error', { status: res.status, data });
        
        // Provide more specific error messages based on status
        let userFriendlyError = errorMsg;
        if (res.status === 401) {
          userFriendlyError = 'Authentication expired. Please reconnect your YouTube account.';
        } else if (res.status === 400 && errorMsg.includes('YouTube not connected')) {
          userFriendlyError = 'YouTube account not connected. Please connect your YouTube account first.';
        } else if (res.status === 400 && errorMsg.includes('credentials')) {
          userFriendlyError = 'YouTube credentials invalid. Please reconnect your YouTube account.';
        } else if (res.status === 500) {
          userFriendlyError = 'Server error occurred. Please try again later.';
        }
        
        setError(userFriendlyError);
      } else {
        console.log('YouTube Refresh: Success! Data updated.');
        // Convex will automatically re-run queries and update the UI
        // No need to manually reload the page
        setSuccess(true);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e: any) {
      const errorMsg = e.message || 'Network error occurred';
      console.error('YouTube Refresh: Network/unexpected error', e);
      setError(`Network error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  return { refresh, loading, error, success };
} 