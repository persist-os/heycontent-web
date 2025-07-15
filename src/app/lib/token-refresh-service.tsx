'use client';

import { useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { updateTokenForUser, isTokenExpiringSoon } from './firebase-token-manager';

// Check token every 5 minutes
const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface TokenRefreshServiceProps {
  user: User | null;
  onTokenRefreshed?: (token: string) => void;
  onTokenRefreshError?: (error: Error) => void;
}

export function TokenRefreshService({ 
  user, 
  onTokenRefreshed, 
  onTokenRefreshError 
}: TokenRefreshServiceProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (!user) {
      // Clear interval if user is not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Function to check and refresh token if needed
    const checkAndRefreshToken = async () => {
      if (isRefreshingRef.current) {
        console.log('Token refresh already in progress, skipping...');
        return;
      }

      try {
        if (isTokenExpiringSoon()) {
          console.log('Token is expiring soon, refreshing...');
          isRefreshingRef.current = true;
          
          const newToken = await updateTokenForUser(user, true);
          console.log('Background token refresh successful');
          
          if (onTokenRefreshed) {
            onTokenRefreshed(newToken);
          }
        }
      } catch (error) {
        console.error('Background token refresh failed:', error);
        if (onTokenRefreshError) {
          onTokenRefreshError(error as Error);
        }
      } finally {
        isRefreshingRef.current = false;
      }
    };

    // Initial check
    checkAndRefreshToken();

    // Set up interval to check token periodically
    intervalRef.current = setInterval(checkAndRefreshToken, TOKEN_CHECK_INTERVAL);

    // Cleanup on unmount or user change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isRefreshingRef.current = false;
    };
  }, [user, onTokenRefreshed, onTokenRefreshError]);

  // This component doesn't render anything
  return null;
}

// Hook version for easier use
export function useTokenRefresh(user: User | null) {
  const onTokenRefreshed = (token: string) => {
    console.log('Token refreshed successfully in background');
    // You can dispatch events here if needed
    window.dispatchEvent(new CustomEvent('tokenRefreshed', { detail: { token } }));
  };

  const onTokenRefreshError = (error: Error) => {
    console.error('Token refresh error:', error);
    // You can dispatch events here if needed
    window.dispatchEvent(new CustomEvent('tokenRefreshError', { detail: { error } }));
  };

  return {
    TokenRefreshService: () => (
      <TokenRefreshService 
        user={user} 
        onTokenRefreshed={onTokenRefreshed}
        onTokenRefreshError={onTokenRefreshError}
      />
    )
  };
} 