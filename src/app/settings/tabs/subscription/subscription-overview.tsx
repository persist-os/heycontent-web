"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSubscriptionPlans, getSubscriptionStatus, createCustomerPortalSession } from '@/app/lib/subscription-api';
import { CheckoutForm } from './stripe-checkout';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { handleSignOut } from '../../utils';

import { UsageAndBillingCard } from './cards/UsageAndBillingCard';
import { OverageControlsCard } from './cards/OverageControlsCard';
import { AccountSubscriptionCard } from './cards/AccountSubscriptionCard';
import { RecentUsageEventsCard } from './cards/RecentUsageEventsCard';
import { QuantityChangeDialog } from './cards/QuantityChangeDialog';
import UpgradeModal from './upgrade-modal';
import { useAuth } from "@/app/context/auth-context";
import { useAdminAuth } from "@/app/lib/admin-auth";
import { getApiKey, getCurrentUserId } from '@/app/lib/api-helpers';

// Convex imports
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { T } from '@/components/translation/T';

// Utils
import { DeleteAccountButton } from '../../utils/DeleteAccountButton';

export default function SubscriptionOverview() {
  const router = useRouter();
  const { firebaseUser, authLoading } = useAuth();
  const { isAdmin, isSuperAdmin } = useAdminAuth();
  const canSeeAdminUsage = Boolean(isAdmin || isSuperAdmin);
  const [userId, setUserId] = useState<string>('');
  
  // API data state
  const [plans, setPlans] = useState<Record<string, any>>({});
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [status, setStatus] = useState<any>(null); // Store status separately
  const [usageSummary, setUsageSummary] = useState<{ total: number; included: number; overage: number }>({ total: 0, included: 0, overage: 0 });
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

  // Initialize userId on mount
  useEffect(() => {
    async function initUserId() {
      try {
        const uid = await getCurrentUserId();
        setUserId(uid);
      } catch (error) {
        console.error('Failed to get userId:', error);
      }
    }
    initUserId();
  }, []);

  // Convex usage queries
  const convexUsageSummary = useQuery(api.usageEvents.getUsageSummary, userId ? { userId } : "skip");
  const convexUsageEvents = useQuery(
    api.usageEvents.listUsageEvents,
    userId && canSeeAdminUsage ? { userId, limit: 20 } : "skip"
  );
  // Convex overage settings
  const overageSettings = useQuery(api.usageEvents.getOverageSettings, userId ? { userId } : "skip");
  // Convex subscription data - PRIMARY SOURCE
  const convexSubscription = useQuery(api.subscriptionQueries.getCurrentSubscription, userId ? { userId } : "skip");
  

  const mutateOverageSettings = useMutation(api.usageEvents.updateOverageSettings);
  
  // Update usage summary when convex data changes
  useEffect(() => {
    if (convexUsageSummary) {
      setUsageSummary({
        total: convexUsageSummary.total || 0,
        included: convexUsageSummary.included || 0,
        overage: convexUsageSummary.overage || 0
      });
    }
  }, [convexUsageSummary]);

  // Overage controls state - Initialize with null to avoid showing defaults before Convex data loads
  const [ubpEnabled, setUbpEnabled] = useState<boolean | null>(null);
  const [monthlyLimit, setMonthlyLimit] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync overage settings from Convex when loaded
  useEffect(() => {
    if (overageSettings && typeof overageSettings === 'object') {
      // Only set if we haven't initialized yet or if the values are different
      if (typeof overageSettings.ubpEnabled === 'boolean') {
        setUbpEnabled(overageSettings.ubpEnabled);
      }
      if (typeof overageSettings.monthlyLimit === 'number') {
        setMonthlyLimit(overageSettings.monthlyLimit);
      }
    }
  }, [overageSettings]);

  // Helper: get API key with retries to avoid transient race after navigation
  async function getApiKeyWithRetry(maxRetries: number = 10, delayMs: number = 200): Promise<string | null> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const key = await getApiKey();
        if (key) return key;
      } catch (e) {
        // ignore and retry
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
    return null;
  }

  // Fetch plans from Convex (cached, instant)
  const convexPlans = useQuery(api.subscriptionPlansQueries.getAllPlans, {});
  
  // Fetch subscription status from API (fallback only - Convex is primary)
  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      // Only fetch from backend if Convex data is not available
      if (convexSubscription !== undefined) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const apiKey = await getApiKeyWithRetry();
        if (!apiKey) {
          setError('No API key found. Please log in again.');
          setLoading(false);
          return;
        }
        let statusObj = null;
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
            statusObj = JSON.parse(responseText);
          } catch (parseError) {
            throw new Error('Invalid JSON in subscription status response');
          }
        } catch (e) {
          statusObj = null;
          setCurrentSubscription(null);
        }
        setStatus(statusObj);
      } catch (e: any) {
        setError(e.message || 'Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId, convexSubscription]);

  // Update plans state when Convex data loads
  useEffect(() => {
    if (convexPlans) {
      setPlans(convexPlans);
    }
  }, [convexPlans]);

  // Helper function to get plan display name from Convex plan field
  const getPlanDisplayName = (plan: string): string => {
    switch (plan) {
      case 'monthly_free':
        return 'Free Monthly';
      case 'monthly_basic':
        return 'Basic Monthly';
      case 'monthly_pro':
        return 'Pro Monthly';
      case 'yearly_basic':
        return 'Basic Yearly';
      case 'yearly_pro':
        return 'Pro Yearly';
      default:
        return plan;
    }
  };

  // Map Convex subscription data to display format - PRIMARY SOURCE
  useEffect(() => {
    // Use Convex subscription data as primary source
    if (convexSubscription) {
      const plan = convexSubscription.plan || 'monthly_free';
      const planTypeMatch = plan.match(/^(monthly|yearly)_(.+)$/);
      const interval = planTypeMatch ? planTypeMatch[1] : 'monthly';
      const planKey = planTypeMatch ? planTypeMatch[2].toLowerCase() : 'free';
      
      let planPrice = 0;
      let planIncludedRequests = convexSubscription.includedRequests || 50;
      let isMetered = false;
      
      // Try to get plan details from Convex plans table
      if (plans && typeof plans === 'object' && plans[planKey] && plans[planKey][interval]) {
        const planDetails = plans[planKey][interval];
        planPrice = planDetails.amount || 0;
        planIncludedRequests = planDetails.includedRequests || planIncludedRequests;
        isMetered = planDetails.is_metered || false;
      }
      
      const mappedSubscription = {
        plan_type: plan,
        plan_name: getPlanDisplayName(plan),
        is_subscribed: convexSubscription.status === 'active',
        status: convexSubscription.status,
        current_period_end: convexSubscription.currentPeriodEnd,
        cancel_at_period_end: convexSubscription.cancelAtPeriodEnd || false,
        price: planPrice,
        plan: {
          name: getPlanDisplayName(plan),
          price: planPrice,
          interval: interval === 'monthly' ? 'month' : 'year',
          is_metered: isMetered,
        }
      };
      
      setCurrentSubscription(mappedSubscription);
      
      // Update usageSummary.included to match the plan's includedRequests
      if (planIncludedRequests !== undefined) {
        setUsageSummary(prev => ({ ...prev, included: planIncludedRequests }));
      }
      return;
    }
    
    // Fallback to backend API status if Convex data not available
    if (!status) {
      // If subscription field is missing, assume monthly_free
      const mappedSubscription = {
        plan_type: 'monthly_free',
        plan_name: 'Free Monthly',
        is_subscribed: true,
        status: 'active',
        plan: {
          name: 'Free Monthly',
          price: 0,
          interval: 'month',
          is_metered: false,
        }
      };
      setCurrentSubscription(mappedSubscription);
      return;
    }
    
    // Legacy backend API mapping (fallback only)
    let mappedSubscription = status;
    let planIncludedRequests = undefined;
    
    if (status && (status.plan_name || status.planType || status.plan_type)) {
      let planPrice = undefined;
      let planInterval = 'month';
      let matchedPlan = undefined;
      let matchedInterval = undefined;
      const planType = status.planType || status.plan_type || '';
      const planTypeMatch = planType.match(/^(monthly|yearly)_(.+)$/);
      if (planTypeMatch && plans && typeof plans === 'object') {
        const interval = planTypeMatch[1];
        const planKey = planTypeMatch[2].toLowerCase();
        const planObj = plans[planKey];
        if (planObj && planObj[interval]) {
          matchedPlan = planObj;
          matchedInterval = planObj[interval];
          planPrice = matchedInterval.amount;
          planInterval = matchedInterval.interval;
          planIncludedRequests = matchedInterval.includedRequests;
          mappedSubscription = {
            ...status,
            plan: {
              name: planType,
              price: planPrice,
              interval: planInterval,
              is_metered: matchedInterval.is_metered,
            }
          };
        }
      }
      
      // Fallback: Use backend plan_name if mapping failed
      if (!matchedPlan && status.plan_name) {
        const planType = status.planType || status.plan_type || '';
        const planTypeMatch = planType.match(/^(monthly|yearly)_(.+)$/);
        mappedSubscription = {
          ...status,
          plan: {
            name: status.plan_name,
            price: status.price || 0,
            interval: planTypeMatch ? planTypeMatch[1] : 'month',
            is_metered: false,
          }
        };
      }
    }
    
    if (status && status.price !== undefined && mappedSubscription.plan) {
      mappedSubscription.plan.price = status.price;
    }
    setCurrentSubscription(mappedSubscription);
    if (planIncludedRequests !== undefined) {
      setUsageSummary(prev => ({ ...prev, included: planIncludedRequests }));
    }
  }, [convexSubscription, plans, status]);

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
    if (!userId) return;
    setRedirectingToPortal(true);
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('No API key found. Please log in again.');
      }
      const returnUrl = window.location.origin + '/settings';
      const response = await createCustomerPortalSession(apiKey, userId, firebaseUser?.email || '', returnUrl);
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

  // Handle sign out
  const onSignOut = async () => {
    await handleSignOut(router);
  };

  // Handlers for modals
  const handleOpenUpgradeModal = () => setShowUpgradeModal(true);
  const handleCloseUpgradeModal = () => setShowUpgradeModal(false);
  const handleOpenQuantityModal = (quantity: number) => {
    setPendingQuantity(quantity);
    setShowQuantityModal(true);
  };
  const handleCloseQuantityModal = () => setShowQuantityModal(false);

  const handleSaveUbp = async (newUbpEnabled: boolean, newMonthlyLimit: number) => {
    if (!userId) {
      console.error('Cannot save: missing userId');
      return;
    }
    
    try {
      setSaving(true);
      // Sanitize the limit before saving
      const safeLimit = Number.isFinite(newMonthlyLimit) ? Math.max(0, Math.floor(Number(newMonthlyLimit))) : 25;
      
      await mutateOverageSettings({ 
        userId: userId, 
        ubpEnabled: newUbpEnabled, 
        monthlyLimit: safeLimit 
      });
      
    } catch (e) {
      console.error('Failed to save overage settings to Convex:', e);
      throw e; // Re-throw so the UI can handle the error
    } finally {
      setSaving(false);
    }
  };

  if (loading || convexSubscription === undefined) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-5 w-1/4" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  // If user doesn't have any subscription (including free), show the checkout form
  // Check Convex subscription first, then fallback to status
  const hasSubscription = convexSubscription 
    ? (convexSubscription.status === 'active' && convexSubscription.plan)
    : (status && (status.is_subscribed || status.plan_type));
  
  if (!hasSubscription && !loading && convexSubscription !== undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] py-12 px-4 w-full">
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-card rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-2">Get full access to HeyContext</h1>
            <p className="mb-6 text-muted-foreground">Pick a plan to unlock your private AI workspace. You can change or cancel anytime.</p>
            
            <div className="mb-6">
              <Button 
                onClick={handleOpenUpgradeModal}
                className="w-full sm:w-auto"
                size="lg"
              >
                View plans
              </Button>
            </div>
            
            <UpgradeModal
              open={showUpgradeModal}
              onClose={handleCloseUpgradeModal}
              onSelectPlan={handleSelectPlan}
              context="registration"
            />
            
            {showCheckout && selectedPlanId && (
              <div className="mt-8">
                <CheckoutForm
                  planId={selectedPlanId}
                  onSuccess={handleCheckoutSuccess}
                  onCancel={handleCheckoutCancel}
                />
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-lg font-medium mb-4">Account</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">Done for now? You can delete your account and all data at any time.</p>
                  <DeleteAccountButton />
                </div>
                <div className="pt-4 border-t border-border">
                  <Button
                    onClick={onSignOut}
                    variant="outline"
                    className="w-full flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[300px] py-12 px-4 w-full">
        <div className="w-full flex flex-col md:flex-row md:gap-12 md:justify-center md:items-start max-w-5xl gap-6">
          {/* Left Column: Usage and Events */}
          <div className="w-full md:w-2/3 max-w-xl mx-auto md:mx-0 flex flex-col gap-6">
            <UsageAndBillingCard usage={usageSummary} />
            {/* Extra requests lives with usage for better context */}
            {ubpEnabled !== null && monthlyLimit !== null ? (
              <OverageControlsCard
                ubpEnabled={ubpEnabled}
                monthlyLimit={monthlyLimit}
                saving={saving}
                setUbpEnabled={setUbpEnabled}
                setMonthlyLimit={setMonthlyLimit}
                handleSaveUbp={handleSaveUbp}
              />
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base"><T context="settings.subscription.overage.title">Extra requests</T></CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse bg-muted h-4 w-4 rounded"></div>
                    <div className="animate-pulse bg-muted h-4 w-32 rounded"></div>
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="animate-pulse bg-muted h-4 w-24 rounded"></div>
                    <div className="animate-pulse bg-muted h-4 w-8 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            )}
            {canSeeAdminUsage && (
              <RecentUsageEventsCard usageEvents={usageEvents} />
            )}
          </div>
          {/* Right Column: Account and Controls */}
          <div className="w-full md:w-1/3 max-w-md mx-auto md:mx-0 flex flex-col gap-6">
            <AccountSubscriptionCard
              user={{
                displayName: firebaseUser?.displayName || 'User',
                email: firebaseUser?.email || 'No email provided'
              }}
              currentSubscription={currentSubscription}
              handleUpgrade={handleOpenUpgradeModal}
              handleOpenQuantityModal={() => handleOpenQuantityModal(currentSubscription?.quantity || 1)}
              handleManageSubscription={handleManageSubscription}
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
 