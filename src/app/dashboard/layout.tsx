'use client'

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { DashboardNav } from './_components/dashboard-nav';
import { useAuth } from '@/app/context/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from '@/app/context/sidebar-context';
import { useSubscriptionCheck } from '@/app/hooks/useSubscriptionCheck';
import { getApiKey } from '@/app/lib/api-helpers';
import { useApiKeyMonitor } from '@/app/hooks/useApiKeyMonitor';
import { RefreshState } from '@/components/ui/refresh-state';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UpgradeModal from '@/app/settings/tabs/subscription/upgrade-modal';
import { useContentContextActions } from '@/store/content-context-store';

// Pages that don't require a subscription
const PUBLIC_PATHS = [
  '/dashboard/subscribe-tab/subscription',
  '/auth/logout',
];

// Pages that should be accessible even without a subscription
const ALLOWED_WITHOUT_SUBSCRIPTION = [
  '/dashboard/subscribe-tab/subscription',
  '/auth/logout',
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { firebaseUser, authLoading } = useAuth();
  const { isExpanded, setIsExpanded } = useSidebar();
  const { clearContentContext } = useContentContextActions();
  
  // Track user changes to clear context on logout/login
  const previousUserRef = useRef<string | null>(null);
  
  // Check if current path is public or doesn't require a subscription
  const isPublicPath = useMemo(() => {
    return PUBLIC_PATHS.some(path => pathname.startsWith(path));
  }, [pathname]);

  // Check subscription status (only if not on a public path)
  const { 
    isSubscribed, 
    isLoading: isSubscriptionLoading, 
    error: subscriptionError 
  } = useSubscriptionCheck(isPublicPath ? 'free' : 'free');

  // State for subscription enforcement modal
  const [showSubscriptionRequired, setShowSubscriptionRequired] = useState(false);

  // Monitor API key validity (only when authenticated)
  useApiKeyMonitor(); // 🔒 ENABLED: Provides immediate logout when logged in elsewhere
  
  // Clear content context when user changes (logout/login)
  useEffect(() => {
    const currentUserId = firebaseUser?.uid || null;
    const previousUserId = previousUserRef.current;
    
    // If user changed (including logout), clear context
    if (previousUserId !== null && previousUserId !== currentUserId) {
      console.log('🧹 User changed, clearing content context', { previousUserId, currentUserId });
      clearContentContext();
    }
    
    previousUserRef.current = currentUserId;
  }, [firebaseUser?.uid, clearContentContext]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      // Only redirect if NOT already on any /auth/login page (with or without query params)
      if (window.location.pathname.startsWith('/auth/login')) return;
      if (window.location.pathname.startsWith('/auth/')) return; // Don't interfere with auth pages that might have reason parameters
      window.location.href = '/auth/login';
    }
  }, [firebaseUser, authLoading]);

  // Handle subscription checks and redirects
  useEffect(() => {
    // Skip if still loading or on a public path
    if (isSubscriptionLoading || isPublicPath) return;
    
    // Don't show modal if subscription status is still being determined (null means not yet checked)
    if (isSubscribed === null) {
      console.log('🔍 [DASHBOARD] Subscription status not yet determined, waiting...');
      return;
    }
    
    // Check if user has a valid subscription
    // Users must have isSubscribed=true to access the platform
    console.log('🔍 [DASHBOARD] Subscription check:', {
      isSubscribed,
      isSubscriptionLoading,
      subscriptionError,
      firebaseUser: firebaseUser?.uid
    });
    
    if (!isSubscribed) {
      console.log('🔒 [DASHBOARD] User not subscribed, showing subscription modal');
      if (!showSubscriptionRequired) {
        setShowSubscriptionRequired(true);
      }
      return;
    }
    
    // If backend signals free-tier exceeded, lock to subscription page
    const controller = new AbortController();
    (async () => {
      try {
        const apiKey = await getApiKey();
        if (!apiKey) return;
        // Lightweight ping to backend usage summary to detect headers/errors
        const resp = await fetch('/api/subscription/usage', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${apiKey}` },
          signal: controller.signal,
        });
        if (resp.status === 402) {
          // Check if it's a subscription required error
          if (resp.headers.get('X-Subscription-Required') === 'true') {
            console.log('🔒 [DASHBOARD] Backend returned subscription required, showing modal');
            if (!showSubscriptionRequired) {
              setShowSubscriptionRequired(true);
            }
            return;
          }
        }
      } catch (_) {
        // Ignore errors; don't block dashboard
      }
    })();

    return () => controller.abort();
  }, [isPublicPath, isSubscriptionLoading, isSubscribed, showSubscriptionRequired, pathname, router]);

  // Global fetch interceptor for subscription required errors
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const originalFetch = window.fetch;
    const patchedFetch: typeof window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await originalFetch(input, init);
      try {
        if (res.status === 402) {
          // Check if it's a subscription required error
          if (res.headers.get('X-Subscription-Required') === 'true') {
            console.log('🔒 [DASHBOARD] Global fetch interceptor caught subscription required, showing modal');
            if (!showSubscriptionRequired) {
              setShowSubscriptionRequired(true);
            }
            return res;
          }
        }
      } catch {}
      return res;
    };
    window.fetch = patchedFetch;
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Immediately render the layout and let children handle their own loading states.
  // The auth and subscription checks will run in the background and trigger redirects
  // or state updates without blocking the initial render.

  return (
    <div className="relative flex min-h-screen">
      {/* Backdrop overlay */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}
      
      <DashboardNav />
      
      {/* Floating Command Palette Trigger */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed top-6 left-6 z-40 group p-3"
        aria-label="Open command palette"
        title="Open command palette (⌘K)"
      >
        <div className="relative">
          {/* Subtle backdrop blur effect */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl border border-border/40 shadow-lg group-hover:shadow-xl group-hover:border-border/60 transition-all duration-300" />

          {/* Button content */}
          <div className="relative w-6 h-6 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Menu className="w-3.5 h-3.5 text-primary/70" />
          </div>
        </div>
      </button>
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
      
      <UpgradeModal
        open={showSubscriptionRequired}
        onClose={() => {}} // Non-dismissible
        onSelectPlan={async (planId: string) => {
          if (planId === 'free') {
            // Handle free tier selection
            try {
              const apiKey = await getApiKey();
              if (!apiKey) {
                console.error('No API key found. Please log in again.');
                return;
              }
              
              const response = await fetch('/api/subscription/free-tier', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  userId: firebaseUser?.uid,
                  email: firebaseUser?.email || '',
                  name: firebaseUser?.displayName || ''
                })
              });
              
              if (!response.ok) {
                console.error('Failed to create free subscription');
                return;
              }
              
              const result = await response.json();
              
              if (result.success) {
                setShowSubscriptionRequired(false);
                window.location.reload();
              } else {
                console.error('Failed to create free subscription:', result.error);
              }
            } catch (error) {
              console.error('Error creating free subscription:', error);
            }
          } else {
            // For paid plans, the UpgradeModal will handle Stripe checkout
            // The modal will close automatically after successful checkout
            setShowSubscriptionRequired(false);
          }
        }}
        context="subscription_required"
      />
    </div>
  );
}