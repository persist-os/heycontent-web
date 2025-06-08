'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import SubscriptionOverview from '@/app/dashboard/_components/settings-screen/tabs/subscription/subscription-overview';

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <SubscriptionOverview />
    </div>
  );
}
