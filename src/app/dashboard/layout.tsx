'use client'

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { DashboardNav } from './_components/dashboard-nav';
import { GlobalNav } from './_components/global-nav';
import { useAuth } from '@/app/context/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from '@/app/context/sidebar-context';
import { useSubscriptionCheck } from '@/app/hooks/useSubscriptionCheck';
import { getApiKey } from '@/app/lib/api-helpers';
import { useApiKeyMonitor } from '@/app/hooks/useApiKeyMonitor';
import { Button } from '@/components/ui/button';
import UpgradeModal from '@/app/settings/tabs/subscription/upgrade-modal';
import { useContentContextActions } from '@/store/content-context-store';
import { UsernameRequiredModal } from '@/components/auth/UsernameRequiredModal';
import { useUsernameRequired } from '@/hooks/useUsernameRequired';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUpgradeFlow } from '@/app/hooks/useUpgradeFlow';
import { OmnipresentBackButton } from '@/components/ui/omnipresent-back-button';

// Pages that don't require a subscription
const PUBLIC_PATHS = [
  '/dashboard/subscribe-tab/subscription',
  '/settings',
  '/auth/logout',
];

// Pages that should be accessible even without a subscription
const ALLOWED_WITHOUT_SUBSCRIPTION = [
  '/dashboard/subscribe-tab/subscription',
  '/settings',
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
  
  // Get usage summary directly from Convex
  const usageSummary = useQuery(
    api.usageEvents.getUsageSummary,
    firebaseUser?.uid ? { userId: firebaseUser.uid } : "skip"
  );
  const initializeFreeTier = useMutation(api.subscriptionQueries.initializeFreeTier);
  
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

  // REMOVED: State for old subscription enforcement modal (no longer needed)
  // const [showSubscriptionRequired, setShowSubscriptionRequired] = useState(false);

  // Check if username is required
  const { needsUsername, isLoading: isUsernameLoading } = useUsernameRequired();
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  // Upgrade flow for free tier limit detection
  const { 
    showUpgradeModal, 
    upgradeReason, 
    handlePaymentRequired,
    handleSelectPlan, 
    handleClose 
  } = useUpgradeFlow();

  // Monitor API key validity (only when authenticated)
  useApiKeyMonitor(); // 🔒 ENABLED: Provides immediate logout when logged in elsewhere
  
  // Listen for upgrade-required events from API (402 responses)
  useEffect(() => {
    const handleUpgradeRequired = (event: any) => {
      handlePaymentRequired(event.detail?.reason || 'limit_reached');
    };
    
    window.addEventListener('upgrade-required', handleUpgradeRequired);
    
    return () => {
      window.removeEventListener('upgrade-required', handleUpgradeRequired);
    };
  }, [handlePaymentRequired]);
  
  // Clear content context when user changes (logout/login)
  useEffect(() => {
    const currentUserId = firebaseUser?.uid || null;
    const previousUserId = previousUserRef.current;
    
    // If user changed (including logout), clear context
    if (previousUserId !== null && previousUserId !== currentUserId) {
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

  // Show username modal ONLY after subscription is confirmed
  // Check if username is required and show modal
  useEffect(() => {
    // All users now have free tier subscription by default
    // Just check if username is needed
    if (!isUsernameLoading && needsUsername && firebaseUser) {
      setShowUsernameModal(true);
    } else {
      setShowUsernameModal(false);
    }
  }, [needsUsername, isUsernameLoading, firebaseUser]);

  // Auto-fix broken subscriptions (0/0 requests state)
  useEffect(() => {
    if (firebaseUser?.uid && usageSummary) {
      // If usage shows broken state (fallback defaults were used), auto-fix it
      const isBrokenState = usageSummary.included === 50 && usageSummary.total === 0;
      if (isBrokenState) {
        console.log('[Dashboard] Auto-fixing broken subscription...');
        initializeFreeTier({ userId: firebaseUser.uid })
          .then(() => console.log('[Dashboard] ✅ Subscription fixed'))
          .catch(err => console.error('[Dashboard] ❌ Failed to fix subscription:', err));
      }
    }
  }, [firebaseUser?.uid, usageSummary, initializeFreeTier]);

  // DISABLED: Subscription enforcement - free tier is now auto-initialized
  // Users always have a subscription (free tier minimum)
  // Limits are enforced by middleware with 402 responses
  // The useUpgradeFlow hook handles showing upgrade modals
  
  // useEffect(() => {
  //   // This subscription check is no longer needed
  //   // Free tier is auto-initialized, so all users have a subscription
  // }, []);

  // DISABLED: Global fetch interceptor - replaced by api-helpers.ts event system
  // The fetchWithApiKey function in api-helpers.ts now handles 402 detection
  // and emits 'upgrade-required' events that the useUpgradeFlow hook listens for
  
  // useEffect(() => {
  //   // This fetch interceptor is no longer needed
  //   // 402 detection happens in api-helpers.ts with custom events
  // }, []);

  // Immediately render the layout and let children handle their own loading states.
  // The auth and subscription checks will run in the background and trigger redirects
  // or state updates without blocking the initial render.

  return (
    <div className="relative flex min-h-screen">
      {/* Global Navigation Sidebar */}
      <GlobalNav />
      
      {/* Omnipresent Back Button - appears on every screen */}
      <OmnipresentBackButton />
      
      {/* Backdrop overlay for command palette */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-[70]"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Command Palette Modal */}
      <DashboardNav />
      
      {/* Main Content Area - offset for sidebar */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-[60px] md:pt-0 ml-0 md:ml-14">
        {children}
      </main>
      
      {/* REMOVED: Old subscription enforcement modal */}
      {/* This modal has been replaced by the new upgrade flow system below */}
      {/* Free tier is now auto-initialized, so this modal is no longer needed */}

      <UsernameRequiredModal
        isOpen={showUsernameModal}
        onUsernameSet={() => {
          setShowUsernameModal(false);
          // Redirect to home page after username is set
          window.location.href = '/dashboard';
        }}
      />

      {/* Free tier limit reached modal - triggered by 402 API responses */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={handleClose}
        onSelectPlan={handleSelectPlan}
        context="subscription_required"
      />
    </div>
  );
}