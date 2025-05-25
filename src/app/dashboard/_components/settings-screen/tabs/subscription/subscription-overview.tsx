"use client";

import { useState, useEffect } from 'react';
import { getSubscriptionPlans, getSubscriptionStatus, createCustomerPortalSession } from '@/app/lib/subscription-api';
import { CheckoutForm } from './stripe-checkout';

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
  console.log('SubscriptionOverview component rendering');
  
  const { user } = useAuth();
  const userId = user?.uid || '';
  
  console.log('User in SubscriptionOverview:', user ? { uid: user.uid, email: user.email } : 'No user');

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
  const [redirectingToPortal, setRedirectingToPortal] = useState(false);

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
          // Always call the Next.js API route, not the backend directly, to avoid CORS
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
          console.log('Fetching subscription status for user:', user.uid);
          console.log('Using API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'none');
          
          // Use the Next.js API route instead of calling backend directly
          const statusUrl = `/api/subscription/status`;
          console.log('Fetching from URL:', statusUrl);
          
          const response = await fetch(statusUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            }
          });
          
          console.log('Status response received:', {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch subscription status: ${response.status} ${response.statusText}`);
          }
          
          const responseText = await response.text();
          console.log('Response text:', responseText.substring(0, 100) + (responseText.length > 100 ? '...' : ''));
          
          try {
            status = JSON.parse(responseText);
            console.log('Parsed status:', status);
          } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            throw new Error('Invalid JSON in subscription status response');
          }
        } catch (e) {
          console.error('Error fetching subscription status:', e);
          status = null;
        }
        // Map status to expected structure for AccountSubscriptionCard
        let mappedSubscription = status;
        if (status && status.plan_name) {
          // Find price from plans if possible
          let planPrice = undefined;
          if (Array.isArray(plans)) {
            const matchedPlan = plans.find((p) => {
              // Try to match by name or plan_type
              return (
                p.name === status.plan_name ||
                p.id === status.plan_type ||
                p.plan_type === status.plan_type
              );
            });
            if (matchedPlan) {
              planPrice = matchedPlan.amount || matchedPlan.price || matchedPlan.amount_cents / 100;
              mappedSubscription = {
                ...status,
                plan: {
                  name: status.plan_name,
                  price: planPrice,
                  interval: matchedPlan.interval
                }
              };
            }
          }
        }
        setCurrentSubscription(mappedSubscription);
        // TODO: Fetch sessions and usageEvents from backend endpoints
      } catch (e: any) {
        setError(e.message || 'Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.uid]);

  // Checkout state
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Function to handle plan selection from UpgradeModal
  const handleSelectPlan = (planId: string): void => {
    console.log('Selected plan ID:', planId);
    setSelectedPlanId(planId);
    setShowCheckout(true);
    setShowUpgradeModal(false);
  };
  
  // Handle checkout success
  const handleCheckoutSuccess = () => {
    setShowCheckout(false);
    // Refresh subscription data
    fetchData();
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
      
      // Get the current URL to use as return URL
      const returnUrl = window.location.href;
      
      // Create a customer portal session
      const response = await createCustomerPortalSession(apiKey, user.uid, user.email, returnUrl);
      
      if (response.success && response.data?.url) {
        // Redirect to the portal URL
        window.location.href = response.data.url;
      } else {
        throw new Error(response.error || 'Failed to create portal session');
      }
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      setError(error.message || 'Failed to open subscription management portal');
    } finally {
      setRedirectingToPortal(false);
    }
  };
  
  // Fetch subscription data
  const fetchData = async () => {
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
      setPlans(plansData ? Object.values(plansData) : []);
      
      // Fetch subscription status
      let status = null;
      try {
        status = await getSubscriptionStatus(apiKey, user.uid);
      } catch (e) {
        status = null;
      }
      setCurrentSubscription(status);
    } catch (e: any) {
      setError(e.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
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
      {/* Checkout Modal */}
      {showCheckout && selectedPlanId && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center overflow-y-auto p-4">
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md md:max-w-lg">
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={() => setShowCheckout(false)}
                className="rounded-full bg-gray-100 dark:bg-gray-800 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close checkout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1">Complete your subscription</h3>
                <p className="text-sm text-gray-500">Enter your payment details to subscribe</p>
              </div>
              <CheckoutForm 
                planId={selectedPlanId} 
                onSuccess={handleCheckoutSuccess}
                onCancel={handleCheckoutCancel}
              />
            </div>
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
          handleManageSubscription={handleManageSubscription}
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