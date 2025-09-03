'use client'

import React, { useEffect, useMemo } from 'react';
import { DashboardNav } from './_components/dashboard-nav';
import { useAuth } from '@/app/context/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from '@/app/context/sidebar-context';
import { useSubscriptionCheck } from '@/app/hooks/useSubscriptionCheck';
import { useApiKeyMonitor } from '@/app/hooks/useApiKeyMonitor';
import { RefreshState } from '@/components/ui/refresh-state';
import { Menu } from 'lucide-react';

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
 
  }, [isPublicPath, isSubscriptionLoading, isSubscribed, pathname, router]);

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
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-background/50 text-foreground transition-transform duration-300 md:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="w-6 h-6" />
      </button>
      
      {/* Desktop menu button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-background/50 text-foreground transition-transform duration-300 hidden md:block"
        aria-label="Toggle menu"
      >
        <Menu className="w-6 h-6" />
      </button>
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}