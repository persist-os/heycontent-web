"use client";

import { useState, useEffect } from 'react';
import { getSubscriptionPlans, getSubscriptionStatus, createCheckoutSession, createCustomer } from '@/app/lib/subscription-api';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe("pk_test_51RP51sHUK9gLy34mXbAmM88KLjBiw8ZMYAi4jRr8GOL4GBgrZGUe7tyXhkuRqyKntft3YCMizK129wBKZTtGSZ0p000BxQ2j3c"); // Replace with your publishable key

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

  // Store client secret for embedded checkout
  const [checkoutClientSecret, setCheckoutClientSecret] = useState(null);

  // Function to handle plan selection from UpgradeModal
  const handleSelectPlan = async (planId) => {
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
      try {
        console.log('Creating/retrieving Stripe customer...');
        await createCustomer(
          apiKey,
          userId,
          user.email || '',
          user.displayName || ''
        );
        console.log('Stripe customer created/retrieved successfully');
      } catch (customerErr) {
        if (!customerErr.message?.includes('already exists')) {
          throw new Error(`Failed to create Stripe customer: ${customerErr.message}`);
        }
      }

      // Now create the checkout session
      console.log('Creating checkout session...');
      const clientSecret = await createCheckoutSession(
        apiKey,
        userId,
        user.email || '',
        user.displayName || '',
        planId,
        `${window.location.origin}/settings?subscription=success`,
        `${window.location.origin}/settings?subscription=canceled`
      );
      setCheckoutClientSecret(clientSecret);
      console.log('Checkout session created successfully');
      
    } catch (err) {
      console.error('Error in subscription process:', err);
      setError(err.message || 'An unexpected error occurred during the subscription process.');
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
      {checkoutClientSecret && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', background: '#fff', padding: 24, borderRadius: 8, width: '100%', maxWidth: 480 }}>
            <button style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }} onClick={() => setCheckoutClientSecret(null)}>
              Close
            </button>
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret: checkoutClientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </div>
      )}
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
          revokeSession={(sessionId) => {
            // TODO: Implement session revocation logic
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
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
} 