'use client'

import React, { useEffect, useMemo } from 'react';
import { DashboardNav } from './_components/dashboard-nav';
import { useAuth } from '@/app/context/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from '@/app/context/sidebar-context';
import { useSubscriptionCheck } from '@/app/hooks/useSubscriptionCheck';
import { Loader2 } from 'lucide-react';

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

  // Show loading state while checking auth and subscription
  if (authLoading || (isSubscriptionLoading && !isPublicPath)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show loading state while checking auth or subscription
  if (authLoading || (isSubscriptionLoading && !isPublicPath)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!firebaseUser) {
    return null;
  }

  // If user needs to subscribe and isn't on the subscription page, don't render the layout
  if (!isPublicPath && !isSubscriptionLoading && isSubscribed === false) {
    return null;
  }

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