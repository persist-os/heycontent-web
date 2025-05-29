"use client";

import { useState, useEffect } from 'react';
import { getSubscriptionPlans, getSubscriptionStatus, createCustomerPortalSession } from '@/app/lib/subscription-api';
import { CheckoutForm } from './stripe-checkout';

import { UsageAndBillingCard } from './cards/UsageAndBillingCard';
import { OverageControlsCard } from './cards/OverageControlsCard';
import { AccountSubscriptionCard } from './cards/AccountSubscriptionCard';
import { RecentUsageEventsCard } from './cards/RecentUsageEventsCard';
import { QuantityChangeDialog } from './cards/QuantityChangeDialog';
import UpgradeModal from './upgrade-modal';
import { useAuth } from "@/app/context/auth-context";
import { getApiKey } from '@/app/lib/api-helpers';

// Convex imports
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';

export default function SubscriptionOverview() {
  const { user } = useAuth();
  const userId = user?.uid || '';

  // API data state
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [usageSummary, setUsageSummary] = useState<{ total: number; included: number; overage: number }>({ total: 62, included: 400, overage: 0 });
  const [usageEvents, setUsageEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [pendingQuantity, setPendingQuantity] = useState(1);
  const [processingSubscription, setProcessingSubscription] = useState(false);
  const [updatingQuantity, setUpdatingQuantity] = useState(false);
  const [redirectingToPortal, setRedirectingToPortal] = useState(false);

  // Convex usage queries
  const convexUsageSummary = useQuery(api.usageEvents.getUsageSummary, userId ? { userId } : "skip");
  const convexUsageEvents = useQuery(api.usageEvents.listUsageEvents, userId ? { userId, limit: 20 } : "skip");

  // Overage controls state
  const [ubpEnabled, setUbpEnabled] = useState(currentSubscription?.ubpEnabled ?? true);
  const [premiumEnabled, setPremiumEnabled] = useState(currentSubscription?.premiumEnabled ?? true);
  const [monthlyLimit, setMonthlyLimit] = useState(currentSubscription?.monthlyLimit ?? 100);
  const [saving, setSaving] = useState(false);

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
          const plansRes = await fetch('/api/subscription/plans', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            }
          });
          if (!plansRes.ok) {
            throw new Error(`Failed to fetch plans: ${plansRes.status} ${plansRes.statusText}`);
          }
          plansData = await plansRes.json();
        } catch (e) {
          plansData = null;
        }
        setPlans(plansData ? Object.values(plansData) : []);
        // Fetch subscription status
        let status = null;
        try {
          const statusUrl = `/api/subscription/status`;
          const response = await fetch(statusUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            }
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch subscription status: ${response.status} ${response.statusText}`);
          }
          const responseText = await response.text();
          try {
            status = JSON.parse(responseText);
          } catch (parseError) {
            throw new Error('Invalid JSON in subscription status response');
          }
        } catch (e) {
          status = null;
        }
        let mappedSubscription = status;
        if (status && (status.plan_name || status.planType || status.plan_type)) {
          let planPrice = undefined;
          let planInterval = 'month';
          let matchedPlan = undefined;
          let matchedInterval = undefined;
          // Use planType or plan_type for matching
          const planType = status.planType || status.plan_type || '';
          // planType might be like 'monthly_basic' or 'yearly_pro'
          const planTypeMatch = planType.match(/^(monthly|yearly)_(.+)$/);
          if (planTypeMatch && plans && typeof plans === 'object') {
            const interval = planTypeMatch[1];
            const planKey = planTypeMatch[2];
            const planObj = Object.values(plans).find((p: any) => p.name?.toLowerCase() === planKey.toLowerCase());
            if (planObj && planObj[interval]) {
              matchedPlan = planObj;
              matchedInterval = planObj[interval];
              planPrice = matchedInterval.amount;
              planInterval = matchedInterval.interval;
              mappedSubscription = {
                ...status,
                plan: {
                  name: planObj.name,
                  price: planPrice,
                  interval: planInterval,
                  is_metered: matchedInterval.is_metered,
                }
              };
            }
          }
          // fallback: try to match by plan_name
          if (!matchedPlan && status.plan_name && plans && typeof plans === 'object') {
            const planObj = Object.values(plans).find((p: any) => p.name === status.plan_name);
            if (planObj && planObj['monthly']) {
              matchedPlan = planObj;
              matchedInterval = planObj['monthly'];
              planPrice = matchedInterval.amount;
              planInterval = matchedInterval.interval;
              mappedSubscription = {
                ...status,
                plan: {
                  name: planObj.name,
                  price: planPrice,
                  interval: planInterval,
                  is_metered: matchedInterval.is_metered,
                }
              };
            }
          }
          // If still no matched plan, but plan_type is basic/free, set a default plan object
          if (!matchedPlan && (planType === 'monthly_basic' || planType === 'basic' || status.plan_name === 'Basic')) {
            mappedSubscription = {
              ...status,
              plan: {
                name: 'Basic',
                price: 0,
                interval: 'month',
                is_metered: false,
              }
            };
          }
        }
        setCurrentSubscription(mappedSubscription);
      } catch (e: any) {
        setError(e.message || 'Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.uid]);

  // Update usage state from Convex
  useEffect(() => {
    if (convexUsageSummary) setUsageSummary(convexUsageSummary);
    if (convexUsageEvents) setUsageEvents(convexUsageEvents);
  }, [convexUsageSummary, convexUsageEvents]);

  // Checkout state
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Function to handle plan selection from UpgradeModal
  const handleSelectPlan = (planId: string): void => {
    setSelectedPlanId(planId);
    setShowCheckout(true);
    setShowUpgradeModal(false);
  };
  
  // Handle checkout success
  const handleCheckoutSuccess = () => {
    setShowCheckout(false);
    // Refresh subscription data
    // fetchData();
    window.location.reload(); // Ensure all usage/subscription data is fresh
  };
  
  // Handle checkout cancel
  const handleCheckoutCancel = () => {
    setShowCheckout(false);
  };
  
  // Handle manage subscription (redirect to Stripe Customer Portal)
  const handleManageSubscription = async () => {
    if (!user?.uid) return;
    setRedirectingToPortal(true);
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('No API key found. Please log in again.');
      }
      const returnUrl = window.location.origin + '/settings';
      const response = await createCustomerPortalSession(apiKey, user.uid, user.email, returnUrl);
      if (response.success && response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error(response.error || 'Failed to create portal session');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to open subscription management portal');
    } finally {
      setRedirectingToPortal(false);
    }
  };

  // Handlers for modals
  const handleOpenUpgradeModal = () => setShowUpgradeModal(true);
  const handleCloseUpgradeModal = () => setShowUpgradeModal(false);
  const handleOpenQuantityModal = (quantity: number) => {
    setPendingQuantity(quantity);
    setShowQuantityModal(true);
  };
  const handleCloseQuantityModal = () => setShowQuantityModal(false);

  const handleSaveUbp = () => {
    setSaving(true);
    // Simulate save
    setTimeout(() => setSaving(false), 1000);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[300px] py-12 px-4 w-full">
        <div className="w-full flex flex-col md:flex-row md:gap-12 md:justify-center md:items-start max-w-5xl gap-6">
          {/* Left Column: Usage and Events */}
          <div className="w-full md:w-2/3 max-w-xl mx-auto md:mx-0 flex flex-col gap-6">
            <UsageAndBillingCard usage={usageSummary} />
            <RecentUsageEventsCard usageEvents={usageEvents} />
          </div>
          {/* Right Column: Account and Controls */}
          <div className="w-full md:w-1/3 max-w-md mx-auto md:mx-0 flex flex-col gap-6">
            <AccountSubscriptionCard
              user={user}
              currentSubscription={currentSubscription}
              handleUpgrade={handleOpenUpgradeModal}
              handleOpenQuantityModal={() => handleOpenQuantityModal(currentSubscription?.quantity || 1)}
              handleManageSubscription={handleManageSubscription}
            />
            <OverageControlsCard
              ubpEnabled={ubpEnabled}
              premiumEnabled={premiumEnabled}
              monthlyLimit={monthlyLimit}
              saving={saving}
              setUbpEnabled={setUbpEnabled}
              setPremiumEnabled={setPremiumEnabled}
              setMonthlyLimit={setMonthlyLimit}
              handleSaveUbp={handleSaveUbp}
            />
          </div>
        </div>
      </div>
      <UpgradeModal
        open={showUpgradeModal}
        onClose={handleCloseUpgradeModal}
        onSelectPlan={handleSelectPlan}
        context="settings"
      />
      {showCheckout && selectedPlanId && (
        <CheckoutForm
          planId={selectedPlanId}
          onSuccess={handleCheckoutSuccess}
          onCancel={handleCheckoutCancel}
        />
      )}
    </>
  );
} 