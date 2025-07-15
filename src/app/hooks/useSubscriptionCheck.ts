import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';

type SubscriptionStatus = {
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'dev' | 'tester' | 'trialing' | 'paused' | 'deleted' | 'unknown' | null;
  plan?: 'monthly_basic' | 'monthly_pro' | 'yearly_basic' | 'yearly_pro' | null;
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

  // Check subscription status when data changes
  useEffect(() => {
    if (!firebaseUser || authLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (subscriptionData === undefined) {
        // Still loading
        return;
      }
      
      if (subscriptionData === null) {
        // No subscription data - treat as not subscribed
        const status = {
          status: null,
          isSubscribed: false
        };
        setSubscriptionStatus(status);
        
        if (requiredPlan !== 'free') {
          setIsSubscribed(false);
          if (!window.location.pathname.startsWith('/dashboard/subscribe-tab/subscription')) {
            window.location.href = '/dashboard/subscribe-tab/subscription';
          }
        } else {
          setIsSubscribed(true);
        }
        return;
      }
      
      // Parse subscription status from Convex data
      const status: SubscriptionStatus = {
        status: subscriptionData.status || null,
        plan: subscriptionData.plan || null,
        currentPeriodEnd: subscriptionData.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
        isSubscribed: ['active', 'trialing', 'dev', 'tester'].includes(subscriptionData.status || ''),
        includedRequests: subscriptionData.includedRequests,
        usedRequests: subscriptionData.usedRequests
      };
      
      setSubscriptionStatus(status);
      
      if (requiredPlan !== 'free' && !status.isSubscribed) {
        setIsSubscribed(false);
        if (!window.location.pathname.startsWith('/dashboard/subscribe-tab/subscription')) {
          window.location.href = '/dashboard/subscribe-tab/subscription';
        }
      } else {
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to check subscription status';
      setError(errorMessage);
      // On error, for non-free plans, we'll assume they need to subscribe
      setIsSubscribed(requiredPlan === 'free');
    } finally {
      setIsLoading(false);
    }
  }, [subscriptionData, firebaseUser, authLoading, requiredPlan]);

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
