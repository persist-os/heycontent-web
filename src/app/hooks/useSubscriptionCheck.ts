import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';

type SubscriptionStatus = {
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'dev' | 'tester' | 'trialing' | 'paused' | 'deleted' | 'unknown' | 'free' | null;
  plan?: 'monthly_basic' | 'monthly_pro' | 'yearly_basic' | 'yearly_pro' | 'monthly_free' | null;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  isSubscribed: boolean;
  includedRequests?: number;
  usedRequests?: number;
};

type SubscriptionPlan = 'free' | 'basic' | 'pro';

export function useSubscriptionCheck(requiredPlan: SubscriptionPlan = 'free') {
  const { firebaseUser, authLoading, getToken } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  // Use Convex query to get subscription status
  const subscriptionData = useQuery(
    api.subscriptionQueries.getUserSubscription, 
    firebaseUser?.uid ? { userId: firebaseUser.uid } : 'skip'
  );
  
  console.log('🔍 [SUBSCRIPTION CHECK] Convex query result:', subscriptionData);

  // Check subscription status when data changes
  useEffect(() => {
    if (!firebaseUser || authLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    const checkSubscriptionStatus = async () => {
      try {
        // First try Convex data
        if (subscriptionData === undefined) {
          // Still loading
          return;
        }
        
        if (subscriptionData === null) {
          // No subscription data in Convex - check backend API
          try {
            const apiKey = await getToken();
            if (apiKey) {
              const response = await fetch('/api/v1/subscription/status', {
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const backendStatus = await response.json();
                const status: SubscriptionStatus = {
                  status: backendStatus.status || 'free',
                  plan: backendStatus.plan_type || 'monthly_free',
                  currentPeriodEnd: backendStatus.current_period_end,
                  cancelAtPeriodEnd: backendStatus.cancel_at_period_end || false,
                  isSubscribed: backendStatus.is_subscribed || false,
                  includedRequests: backendStatus.quotas?.api_requests?.included || 50,
                  usedRequests: backendStatus.quotas?.api_requests?.used || 0
                };
                setSubscriptionStatus(status);
                setIsSubscribed(status.isSubscribed);
                return;
              }
            }
          } catch (backendError) {
            console.warn('Backend subscription check failed, using Convex data:', backendError);
          }
          
          // No subscription data means user is NOT subscribed
          const status: SubscriptionStatus = {
            status: null,
            isSubscribed: false,  // No subscription data = not subscribed
            plan: null
          };
          setSubscriptionStatus(status);
          setIsSubscribed(false);
          return;
        }
        
        // Parse subscription status from Convex data
        const status: SubscriptionStatus = {
          status: subscriptionData.status || null,
          plan: subscriptionData.plan || null,
          currentPeriodEnd: subscriptionData.currentPeriodEnd,
          cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
          // Only consider users subscribed if they have a valid plan AND active status
          isSubscribed: ['active', 'trialing', 'dev', 'tester', 'free'].includes(subscriptionData.status || '') && 
                       !!subscriptionData.plan,
          includedRequests: subscriptionData.includedRequests,
          usedRequests: subscriptionData.usedRequests
        };
        
        console.log('🔍 [SUBSCRIPTION CHECK] Raw data:', subscriptionData);
        console.log('🔍 [SUBSCRIPTION CHECK] Parsed status:', status);
        
        setSubscriptionStatus(status);
        
        // Set the base subscription status first
        setIsSubscribed(status.isSubscribed);
        
        // Check if user meets the required plan level
        if (requiredPlan === 'free') {
          // Free tier is always accessible
          setIsSubscribed(true);
        } else if (requiredPlan === 'basic') {
          // Basic features require at least free tier
          setIsSubscribed(status.isSubscribed);
        } else if (requiredPlan === 'pro') {
          // Pro features require pro subscription
          const isProUser = status.plan?.includes('pro') || false;
          setIsSubscribed(isProUser);
        }
        
        // Note: Redirect logic is handled by the dashboard layout, not here
        // This prevents conflicts between modal display and page redirects
      } catch (err) {
        console.error('Error checking subscription:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to check subscription status';
        setError(errorMessage);
        // On error, for non-free plans, we'll assume they need to subscribe
        setIsSubscribed(requiredPlan === 'free');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSubscriptionStatus();
  }, [subscriptionData, firebaseUser, authLoading, requiredPlan, getToken]);

  const refresh = useCallback(() => {
    // This will trigger a re-fetch of the subscription data
    // by changing the key in the useQuery dependency array
    setSubscriptionStatus(prev => ({
      ...prev,
      lastRefreshed: Date.now()
    }));
  }, []);

  return { 
    isSubscribed, 
    isLoading, 
    error, 
    subscriptionStatus,
    refresh
  };
}
