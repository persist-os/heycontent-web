'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import SubscriptionOverview from '@/app/settings/tabs/subscription/subscription-overview';
import { RefreshState } from '@/components/ui/refresh-state';

export default function SubscriptionPage() {
  const router = useRouter();
  const { firebaseUser, authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push('/auth/login');
    }
  }, [firebaseUser, authLoading, router]);

  // Show loading state while checking auth
  if (authLoading || !firebaseUser) {
    return (
      <div className="min-h-screen">
        <RefreshState
          title="Loading subscription..."
          quote="Checking your subscription status"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <SubscriptionOverview />
    </div>
  );
}
