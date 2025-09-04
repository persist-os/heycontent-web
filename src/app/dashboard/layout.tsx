'use client'

import React, { useEffect, useMemo, useState } from 'react';
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
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ included?: number; used?: number } | null>(null);
  
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

  // Monitor API key validity (only when authenticated)
  useApiKeyMonitor(); // 🔒 ENABLED: Provides immediate logout when logged in elsewhere

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
          // Show modal; do not auto-redirect
          setLimitExceeded(true);
          const inc = Number(resp.headers.get('X-Free-Tier-Limit') || NaN);
          const usd = Number(resp.headers.get('X-Free-Tier-Used') || NaN);
          setLimitInfo({ included: Number.isFinite(inc) ? inc : undefined, used: Number.isFinite(usd) ? usd : undefined });
          return;
        }
        // Also check custom headers if present
        const freeLimit = resp.headers.get('X-Free-Tier-Limit');
        const freeUsed = resp.headers.get('X-Free-Tier-Used');
        if (freeLimit && freeUsed && Number(freeUsed) >= Number(freeLimit)) {
          setLimitExceeded(true);
          setLimitInfo({ included: Number(freeLimit), used: Number(freeUsed) });
        }
      } catch (_) {
        // Ignore errors; don't block dashboard
      }
    })();

    return () => controller.abort();
  }, [isPublicPath, isSubscriptionLoading, isSubscribed, pathname, router]);

  // Global fetch interceptor for 402 (free tier exhausted)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const originalFetch = window.fetch;
    const patchedFetch: typeof window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await originalFetch(input, init);
      try {
        if (res.status === 402) {
          let included: number | undefined;
          let used: number | undefined;
          try {
            const cloned = res.clone();
            const data = await cloned.json();
            if (typeof data?.included === 'number') included = data.included;
            if (typeof data?.used === 'number') used = data.used;
          } catch {}
          setLimitExceeded(true);
          setLimitInfo(prev => ({
            included: included ?? prev?.included,
            used: used ?? prev?.used,
          }));
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
      
      {/* Mobile menu button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed top-3 left-4 z-50 p-1.5 rounded-md bg-background/50 text-foreground transition-transform duration-300 md:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      
      {/* Desktop menu button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed top-3 left-4 z-50 p-1.5 rounded-md bg-background/50 text-foreground transition-transform duration-300 hidden md:block"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
      {limitExceeded && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-background border border-border rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-2">You've used your free requests</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Your free tier limit has been reached{limitInfo?.included !== undefined && limitInfo?.used !== undefined ? ` (${limitInfo.used}/${limitInfo.included})` : ''}. Upgrade your plan to continue using HeyContent.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button
                onClick={() => {
                  try { window.sessionStorage.setItem('settingsActiveTab', 'subscription') } catch {}
                  window.location.href = '/settings';
                }}
              >
                Manage subscription
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}