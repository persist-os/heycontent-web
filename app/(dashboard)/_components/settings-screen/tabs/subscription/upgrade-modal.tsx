"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Loader2 } from "lucide-react";
import { useAuth } from "@/app/context/auth-context";
import { getApiKey } from "@/app/lib/api-helpers";

// Annual discount percentage
const ANNUAL_DISCOUNT_PERCENT = 17;

// Calculate annual price with 17% discount
const calculateAnnualPrice = (monthlyPrice: number): number => {
  const annualPrice = monthlyPrice * 12;
  return Math.round(annualPrice * 0.83); // 17% off
};

interface Plan {
  name: string;
  price_id: string;
  product_id: string;
  amount: number;
  currency: string;
  interval: string;
  features: string[];
}

export default function UpgradeModal({ 
  open, 
  onClose, 
  onSelectPlan 
}: { 
  open: boolean; 
  onClose: () => void; 
  onSelectPlan: (planId: string) => Promise<void>;
}) {
  const { user } = useAuth();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<Record<string, Plan> | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch plans from our new API
  useEffect(() => {
    const fetchPlans = async () => {
      if (!open) return;
      
      try {
        setLoading(true);
        const apiKey = await getApiKey();
        if (!apiKey) {
          throw new Error('No API key found. Please log in again.');
        }
        
        const response = await fetch('/api/subscription/plans', {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch plans');
        }
        
        const plansData = await response.json();
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

  // Fallback plans in case API call fails
  const fallbackPlans = {
    "basic": {
      name: "Basic",
      price_id: "price_1RPSD8HUK9gLy34mXfLOgdgB",
      product_id: "prod_SK69e1FboMpPN6",
      amount: 1500, // $15/month
      currency: "usd",
      interval: "month",
      features: [
        "1,000 API requests included",
        "Pay-as-you-go after limit",
        "Email support"
      ]
    },
    "pro": {
      name: "Pro",
      price_id: "price_1RPSDCHUK9gLy34mNjjBT53L",
      product_id: "prod_SK69CRqOckPpNm",
      amount: 2500, // $25/month
      currency: "usd",
      interval: "month",
      features: [
        "5,000 API requests included",
        "Pay-as-you-go after limit",
        "Priority email support",
        "Advanced analytics dashboard"
      ]
    }
  };

  const displayPlans = plans || fallbackPlans;
  const planArray = Object.entries(displayPlans).map(([id, plan]) => ({
    id,
    ...plan,
    // Convert amount from cents to dollars
    displayAmount: plan.amount / 100,
    // Calculate annual price if needed
    annualAmount: calculateAnnualPrice(plan.amount / 100)
  }));

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    
    // Find the selected plan
    const selectedPlanData = planArray.find(plan => plan.id === planId);
    
    if (!selectedPlanData || !plans) {
      console.error('Selected plan not found or plans data not loaded');
      return;
    }
    
    // Get the correct price ID based on the billing interval
    const planKey = `${planId}_${billingInterval}`;
    let priceId = '';
    
    // Map the plan ID and interval to the correct Stripe price ID
    if (planId === 'basic') {
      priceId = billingInterval === 'monthly' 
        ? 'price_1RQBV6HUK9gLy34mb2C8iEEo' // Basic Monthly
        : 'price_1RQC9DHUK9gLy34mhxT9KX5v'; // Basic Yearly
    } else if (planId === 'pro') {
      priceId = billingInterval === 'monthly'
        ? 'price_1RQBUHHUK9gLy34mIA9wgROw' // Pro Monthly
        : 'price_1RQC8dHUK9gLy34meYG89caI'; // Pro Yearly
    } else {
      // Fallback to using the plan's price_id directly if it exists
      priceId = selectedPlanData.price_id;
    }
    
    console.log(`Selecting plan: ${planId}, interval: ${billingInterval}, using priceId: ${priceId}`);
    
    if (!priceId) {
      console.error('No valid price ID found for selected plan');
      return;
    }
    
    await onSelectPlan(priceId);
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

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading plans...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {planArray.map(plan => {
              const price = billingInterval === "yearly" ? plan.annualAmount : plan.displayAmount;
              const intervalLabel = billingInterval === "yearly" ? "/year" : "/month";
              const includedRequests = plan.id === "basic" ? 1000 : 5000;
              const pricePerRequest = (price / includedRequests).toFixed(4);
              
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
                      <span className="text-3xl font-bold">{formatPrice(price)}</span>
                      <span className="text-gray-500 text-lg"> {intervalLabel}</span>
                    </div>
                    <div className="text-sm text-gray-500 mb-4">
                      {includedRequests.toLocaleString()} API requests included
                      <br />
                      (${pricePerRequest}/request)
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan(plan.id);
                    }}
                  >
                    {selectedPlan === plan.id ? "Selected" : "Select Plan"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        
        <DialogFooter className="mt-4">
          <div className="text-sm text-gray-500 text-center w-full">
            Need more requests or have questions?{" "}
            <a href="mailto:support@heycontent.com" className="text-primary hover:underline">
              Contact our sales team
            </a>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}