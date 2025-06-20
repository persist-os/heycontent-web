'use client'

import React, { useEffect, useMemo } from 'react';
import { DashboardNav } from './_components/dashboard-nav';
import { useAuth } from '@/app/context/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from '@/app/context/sidebar-context';
import { useSubscriptionCheck } from '@/app/hooks/useSubscriptionCheck';
import { RefreshState } from '@/components/ui/refresh-state';

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
  const { isExpanded } = useSidebar();
  
  // Check if current path is public or doesn't require a subscription
  const isPublicPath = useMemo(() => {
    return PUBLIC_PATHS.some(path => pathname.startsWith(path));
  }, [pathname]);

  // Check subscription status (only if not on a public path)
  const { 
    isSubscribed, 
    isLoading: isSubscriptionLoading, 
    error: subscriptionError 
  } = useSubscriptionCheck(isPublicPath ? 'free' : 'basic');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !firebaseUser) {
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
      <div className="fixed inset-y-0 left-0 z-40">
        <DashboardNav />
      </div>
      <main className={`flex-1 transition-[margin] duration-300 ${isExpanded ? 'md:ml-64' : 'ml-0'}`}>
        {children}
      </main>
    </div>
  );
}