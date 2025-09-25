'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import SubscriptionOverview from '@/app/settings/tabs/subscription/subscription-overview';

export default function SubscriptionPage() {
  const router = useRouter();
  const { firebaseUser, authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push('/auth/login');
    }
  }, [firebaseUser, authLoading, router]);

  return (
    <div className="container mx-auto py-8 px-4">
      <SubscriptionOverview />
    </div>
  );
}
