import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { handleSignOut } from '@/app/settings/utils';
import { getApiKey } from '@/app/lib/api-helpers';

/**
 * Hook to monitor API key validity and auto-logout when invalidated
 * Only checks when the user becomes active on the tab to save on API calls
 */
export const useApiKeyMonitor = () => {
  const router = useRouter();
  const hasCheckedOnMount = useRef(false);
  let lastCheck = 0; // or use localStorage/sessionStorage for cross-tab

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    const checkApiKeyValidity = async (source: string = 'unknown') => {
      try {
        // Get the current API key
        const apiKey = await getApiKey();
        if (!apiKey) {
          console.log(`🔒 No API key found (${source}) - redirecting to login`);
          await handleSignOut(router, 'session_expired');
          return;
        }

        // Use the dedicated validation endpoint that actually calls the backend
        const response = await fetch('/api/auth/validate', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        });

        // If we get 401, the API key was invalidated (user logged in elsewhere)
        if (response.status === 401) {
          await handleSignOut(router, 'logged_in_elsewhere');
        } else if (!response.ok) {
        }
        // Success case - no logging needed for normal operation
      } catch (error) {
        // Network errors are ignored - we don't want to logout on connectivity issues
        if (process.env.NODE_ENV === 'development') {
          console.debug(`API key validation network error (${source}):`, error);
        }
      }
    };

    // Check on mount with delay to avoid race conditions
    const initialCheck = () => {
      if (!hasCheckedOnMount.current) {
        hasCheckedOnMount.current = true;
        // Wait 2 seconds after page load to ensure API key is properly set
        setTimeout(() => {
          checkApiKeyValidity('initial-load');
        }, 2000);
      }
    };

    // Check when user becomes active on the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasCheckedOnMount.current) {
        const now = Date.now();
        const lastCheck = Number(localStorage.getItem('lastSessionCheck') || 0);
        if (now - lastCheck > 3 * 60 * 1000) {
          localStorage.setItem('lastSessionCheck', String(now));
          checkApiKeyValidity('tab-visible');
        }
      }
    };

    // Check when user focuses on the window/tab
    const handleFocus = () => {
      if (hasCheckedOnMount.current) {
        checkApiKeyValidity('window-focus');
      }
    };

    // Run initial check
    initialCheck();

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup event listeners on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [router]);
}; 