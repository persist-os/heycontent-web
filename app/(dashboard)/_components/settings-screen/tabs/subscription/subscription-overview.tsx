"use client";

import { useState, useEffect } from 'react';
import { getSubscriptionPlans, getSubscriptionStatus, createPaymentLink, createCustomer } from '@/app/lib/subscription-api';
import { UsageAndBillingCard } from './cards/UsageAndBillingCard';
import { OverageControlsCard } from './cards/OverageControlsCard';
import { AccountSubscriptionCard } from './cards/AccountSubscriptionCard';
import { ActiveSessionsCard } from './cards/ActiveSessionsCard';
import { RecentUsageEventsCard } from './cards/RecentUsageEventsCard';
import { QuantityChangeDialog } from './cards/QuantityChangeDialog';
import UpgradeModal from './upgrade-modal';
import { useAuth } from "@/app/context/auth-context";
import { getApiKey } from '@/app/lib/api-helpers';


export default function SubscriptionOverview() {
  const { user } = useAuth();
  const userId = user?.uid || '';

  // API data state
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]); // TODO: Integrate with backend sessions endpoint
  const [usageEvents, setUsageEvents] = useState<any[]>([]); // TODO: Integrate with backend usage endpoint
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [pendingQuantity, setPendingQuantity] = useState(1);
  const [processingSubscription, setProcessingSubscription] = useState(false);
  const [updatingQuantity, setUpdatingQuantity] = useState(false);

  // Fetch plans and subscription status from API
  useEffect(() => {
    async function fetchData() {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const apiKey = await getApiKey();
        if (!apiKey) {
          throw new Error('No API key found. Please log in again.');
        }
        
        // Fetch plans
        let plansData = null;
        try {
          plansData = await getSubscriptionPlans(apiKey);
        } catch (e) {
          plansData = null;
        }
        // fallback plans if API fails
        const fallbackPlans = [
          {
            _id: 'basic',
            name: 'Basic',
            price: 15,
            includedRequests: 1000,
            features: [
              '1,000 requests/month',
              'Standard support',
              'Basic templates'
            ],
            isActive: true,
            interval: 'month',
            stripePriceId: 'price_1RPSD8HUK9gLy34mXfLOgdgB',
            stripeProductId: 'prod_SK69e1FboMpPN6'
          },
          {
            _id: 'pro',
            name: 'Pro',
            price: 25,
            includedRequests: 5000,
            features: [
              '5,000 requests/month',
              'Priority support',
              'All templates',
              'API access'
            ],
            isActive: true,
            interval: 'month',
            stripePriceId: 'price_1RPSDCHUK9gLy34mNjjBT53L',
            stripeProductId: 'prod_SK69CRqOckPpNm',
            isPerSeat: true
          }
        ];
        setPlans(plansData ? Object.values(plansData) : fallbackPlans);
        // Fetch subscription status
        let status = null;
        try {
          status = await getSubscriptionStatus(apiKey, user.uid);
        } catch (e) {
          status = null;
        }
        setCurrentSubscription(status);
        // TODO: Fetch sessions and usageEvents from backend endpoints
      } catch (e: any) {
        setError(e.message || 'Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.uid]);

  // Function to handle plan selection from UpgradeModal
  const handleSelectPlan = async (planId: string) => {
    if (!userId || !user) {
      setError('User not authenticated.');
      return;
    }
    setProcessingSubscription(true);
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('API key not found. Please log in again.');
      }

      // First, ensure the user has a Stripe customer
      // This will either create a new customer or retrieve an existing one
      try {
        console.log('Creating/retrieving Stripe customer...');
        await createCustomer(
          apiKey,
          userId,
          user.email || '',
          user.displayName || ''
        );
        console.log('Stripe customer created/retrieved successfully');
      } catch (customerErr: any) {
        // If this fails with a 409 Conflict, it means the customer already exists, which is fine
        // Otherwise, it's an actual error
        if (!customerErr.message?.includes('already exists')) {
          throw new Error(`Failed to create Stripe customer: ${customerErr.message}`);
        }
      }

      // Now create the payment link
      console.log('Creating payment link...');
      const paymentUrl = await createPaymentLink(
        apiKey,
        userId,
        planId,
        `${window.location.origin}/settings?subscription=success`,
        `${window.location.origin}/settings?subscription=canceled`
      );

      if (paymentUrl) {
        console.log('Payment link created successfully, redirecting...');
        window.location.href = paymentUrl;
      } else {
        throw new Error('Failed to create payment link.');
      }
    } catch (err: any) {
      console.error('Error in subscription process:', err);
      setError(err.message || 'An unexpected error occurred during the subscription process.');
      // Keep the modal open to show the error
      setShowUpgradeModal(true);
    } finally {
      setProcessingSubscription(false);
    }
  };

  // Handlers for modals (all business logic should be in card components)
  const handleOpenUpgradeModal = () => setShowUpgradeModal(true);
  const handleCloseUpgradeModal = () => setShowUpgradeModal(false);
  const handleOpenQuantityModal = (quantity: number) => {
    setPendingQuantity(quantity);
    setShowQuantityModal(true);
  };
  const handleCloseQuantityModal = () => setShowQuantityModal(false);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <UsageAndBillingCard usage={{
        fastRequests: currentSubscription?.usedFastRequests || 0,
        slowRequests: currentSubscription?.usedSlowRequests || 0
      }} />
      <OverageControlsCard
        ubpEnabled={currentSubscription?.ubpEnabled ?? true}
        premiumEnabled={currentSubscription?.premiumEnabled ?? true}
        monthlyLimit={currentSubscription?.monthlyLimit ?? 20}
        saving={false}
        setUbpEnabled={() => {}}
        setPremiumEnabled={() => {}}
        setMonthlyLimit={() => {}}
        handleSaveUbp={() => {}}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AccountSubscriptionCard
          user={user}
          currentSubscription={currentSubscription}
          handleUpgrade={handleOpenUpgradeModal}
          handleOpenQuantityModal={() => handleOpenQuantityModal(currentSubscription?.quantity || 1)}
        />
        <ActiveSessionsCard
          sessions={sessions}
          revokeSession={(sessionId: string) => {
            // TODO: Implement session revocation logic
            // Example: setSessions(sessions => sessions.map(s => s._id === sessionId ? { ...s, revoked: true } : s));
          }}
        />
      </div>
      <RecentUsageEventsCard usageEvents={usageEvents} />
      <QuantityChangeDialog
        open={showQuantityModal}
        pendingQuantity={pendingQuantity}
        updatingQuantity={updatingQuantity}
        onDecrease={() => setPendingQuantity(q => Math.max(1, q - 1))}
        onIncrease={() => setPendingQuantity(q => q + 1)}
        onCancel={handleCloseQuantityModal}
        onConfirm={() => setShowQuantityModal(false)}
        planPrice={currentSubscription?.plan?.price || 0}
      />
      <UpgradeModal
        open={showUpgradeModal}
        onClose={handleCloseUpgradeModal}
        onSelectPlan={handleSelectPlan} // Use the new handler
      />
    </div>
  );
} 