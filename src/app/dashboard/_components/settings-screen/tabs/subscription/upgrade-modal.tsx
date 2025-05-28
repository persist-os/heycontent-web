"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from "lucide-react";
import { useAuth } from "@/app/context/auth-context";
import { getApiKey } from "@/app/lib/api-helpers";
import { CheckoutForm } from './stripe-checkout';

// Annual discount percentage
const ANNUAL_DISCOUNT_PERCENT = 17;

// Calculate annual price with 17% discount
const calculateAnnualPrice = (monthlyPrice: number): number => {
  const annualPrice = monthlyPrice * 12;
  return Math.round(annualPrice * 0.83); // 17% off
};

interface IntervalPlan {
  price_id: string;
  product_id: string;
  currency: string;
  interval: string;
  amount: number;
  included_requests: number;
  overage: number;
  features: string[];
}

interface BackendPlan {
  name: string;
  monthly?: IntervalPlan;
  yearly?: IntervalPlan;
}


export default function UpgradeModal({ 
  open, 
  onClose, 
  onSelectPlan
}: { 
  open: boolean; 
  onClose: () => void; 
  onSelectPlan: (planId: string) => void;
}) {
  const { user } = useAuth();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<Record<string, BackendPlan> | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Fetch plans from our new API
  useEffect(() => {
    const fetchPlans = async () => {
      if (!open) return;
      
      try {
        setLoading(true);
        console.log('Starting to fetch plans...');
        const apiKey = await getApiKey();
        if (!apiKey) {
          throw new Error('No API key found. Please log in again.');
        }
        
        console.log('Fetching plans from API...');
        const response = await fetch('/api/subscription/plans', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch plans:', response.status, errorText);
          throw new Error(`Failed to fetch plans: ${response.status} ${errorText}`);
        }
        
        const responseData = await response.json();
        console.log('Plans data received:', JSON.stringify(responseData, null, 2));
        
        // Handle the nested data structure
        const plansData = responseData.data || {};
        setPlans(plansData);
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlans();
  }, [open]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Normalize backend plans for the selected interval
  const getPlanArray = () => {
    if (!plans) return [];
    
    return Object.entries(plans).map(([id, plan]) => {
      // Ensure plan has the expected structure
      if (!plan || typeof plan !== 'object') return null;
      
      const intervalPlan = plan[billingInterval];
      if (!intervalPlan) return null;
      
      // Use the features from the API or fallback to defaults
      let features: string[] = [];
      if (Array.isArray(intervalPlan.features)) {
        features = intervalPlan.features.filter(f => typeof f === 'string');
      }
      
      // If no features, use the ones from the API response or create defaults
      if (features.length === 0 && intervalPlan.features) {
        features = Object.values(intervalPlan.features).filter(f => typeof f === 'string');
      }
      
      // If still no features, create default ones
      if (features.length === 0) {
        features = [
          `${intervalPlan.included_requests?.toLocaleString() || '0'} ${billingInterval === 'yearly' ? 'yearly' : 'monthly'} requests`,
          `$${intervalPlan.overage || '0.00'} per additional request`,
          billingInterval === 'yearly' ? '17% discount' : 'Flexible monthly billing'
        ];
      }
      
      return {
        id,
        name: plan.name || id.charAt(0).toUpperCase() + id.slice(1),
        price_id: intervalPlan.price_id || '',
        product_id: intervalPlan.product_id || '',
        currency: intervalPlan.currency || 'usd',
        interval: intervalPlan.interval || billingInterval,
        amount: intervalPlan.amount || 0,
        included_requests: intervalPlan.included_requests || 0,
        overage: intervalPlan.overage || 0,
        features
      };
    }).filter(Boolean);
  };
  const planArray = getPlanArray();

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    // Find the selected plan
    const selectedPlanData = planArray.find(plan => plan.id === planId);
    if (!selectedPlanData) {
      console.error('Selected plan not found');
      return;
    }
    // Use the price_id from the selected interval plan
    const priceId = selectedPlanData.price_id;
    if (!priceId) {
      console.error('No valid price ID found for selected plan');
      return;
    }
    setLoading(true);
    try {
      setSelectedPlanId(priceId);
      setShowCheckout(true);
      // Do not call onSelectPlan here; handle in checkout success/cancel
    } catch (error) {
      console.error('Error selecting plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutSuccess = () => {
    setShowCheckout(false);
    setSelectedPlanId(null);
    onClose();
    // Optionally, call onSelectPlan(selectedPlanId) or notify parent
    // window.location.reload(); // Or trigger parent refresh
  };

  const handleCheckoutCancel = () => {
    setShowCheckout(false);
    setSelectedPlanId(null);
    // Optionally, keep modal open or close
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose Your Plan</DialogTitle>
          <DialogDescription>
            Select a plan that best fits your needs. All plans include pay-as-you-go API usage after included limits.
          </DialogDescription>
        </DialogHeader>
        {showCheckout && selectedPlanId ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <CheckoutForm
              planId={selectedPlanId}
              onSuccess={handleCheckoutSuccess}
              onCancel={handleCheckoutCancel}
            />
            <Button
              variant="outline"
              className="mt-6"
              onClick={handleCheckoutCancel}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-center gap-4 mb-6">
              <Button
                variant={billingInterval === "monthly" ? "default" : "outline"}
                onClick={() => setBillingInterval("monthly")}
              >
                Monthly Billing
              </Button>
              <Button
                variant={billingInterval === "yearly" ? "default" : "outline"}
                onClick={() => setBillingInterval("yearly")}
              >
                Annual Billing <span className="ml-1 text-green-600 font-semibold">(Save {ANNUAL_DISCOUNT_PERCENT}%)</span>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {planArray.map(plan => {
                const intervalLabel = billingInterval === "yearly" ? "/year" : "/month";
                const displayedPrice = plan.amount;
                const includedRequests = plan.included_requests;
                const overagePrice = plan.overage;
                return (
                  <div
                    key={plan.id}
                    className={`border rounded-xl p-6 flex flex-col transition-all ${
                      selectedPlan === plan.id 
                        ? "border-primary shadow-lg scale-[1.02]" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-xl mb-2">{plan.name}</h3>
                      <div className="mb-4">
                        <span className="text-3xl font-bold">${displayedPrice}</span>
                        <span className="text-gray-500 text-lg"> {intervalLabel}</span>
                      </div>
                      <div className="text-sm text-gray-500 mb-4">
                        {includedRequests.toLocaleString()} API requests included
                        <br />
                        <span className="italic">${overagePrice.toFixed(3)} per additional request</span>
                      </div>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <svg 
                              className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      variant={selectedPlan === plan.id ? "default" : "outline"}
                      className="w-full mt-auto"
                      disabled={loading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlan(plan.id);
                      }}
                    >
                      {loading && selectedPlan === plan.id ? (
                        <span className="flex items-center">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...
                        </span>
                      ) : selectedPlan === plan.id ? (
                        "Selected"
                      ) : (
                        "Select Plan"
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
            <DialogFooter className="mt-4">
              <div className="text-sm text-gray-500 text-center w-full">
                Need more requests or have questions?{" "}
                <a href="mailto:hello@divertissement.ai" className="text-primary hover:underline">
                  Contact our sales team
                </a>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}