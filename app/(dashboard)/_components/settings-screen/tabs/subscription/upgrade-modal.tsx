"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/src/components/ui/button';

const PLANS = [
  {
    name: "Basic",
    monthlyPrice: 15,
    requests: 2000,
    features: ["2,000 fast requests included", "Unlimited slow requests", "Basic support"],
  },
  {
    name: "Pro",
    monthlyPrice: 25,
    requests: 5000,
    features: ["5,000 fast requests included", "Unlimited slow requests", "Priority support", "Advanced analytics"],
  },
];

const ANNUAL_DISCOUNT = 0.16;

export default function UpgradeModal({ open, onClose, onSelectPlan }: { open: boolean; onClose: () => void; onSelectPlan: (plan: string, interval: "month" | "year") => void }) {
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose Your Plan</DialogTitle>
          <DialogDescription>
            Select a plan that best fits your needs
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-4 mb-4">
          <Button
            variant={billingInterval === "month" ? "default" : "outline"}
            onClick={() => setBillingInterval("month")}
          >
            Monthly
          </Button>
          <Button
            variant={billingInterval === "year" ? "default" : "outline"}
            onClick={() => setBillingInterval("year")}
          >
            Annually <span className="ml-1 text-green-600 font-semibold">(Save 16%)</span>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLANS.map(plan => {
            const isAnnual = billingInterval === "year" && plan.name === "Pro";
            const price = isAnnual
              ? Math.round(plan.monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT))
              : plan.monthlyPrice;
            const intervalLabel = isAnnual ? "/year" : "/month";
            return (
              <div
                key={plan.name}
                className={`border rounded-lg p-4 flex flex-col items-center ${selectedPlan === plan.name ? "border-purple-500" : "border-gray-200"}`}
                onClick={() => {
                  setSelectedPlan(plan.name);
                  if (plan.name === "Lite") setBillingInterval("month");
                }}
                style={{ cursor: "pointer" }}
              >
                <h3 className="font-bold text-lg mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold mb-1">${price}</div>
                <div className="text-sm text-gray-500 mb-2">{intervalLabel}</div>
                <ul className="text-xs text-gray-600 mb-4 space-y-1">
                  {plan.features.map((feature, i) => <li key={i}>• {feature}</li>)}
                </ul>
                <Button
                  variant={selectedPlan === plan.name ? "default" : "outline"}
                  className="w-full"
                  onClick={() => onSelectPlan(plan.name, plan.name === "Pro" ? billingInterval : "month")}
                  disabled={selectedPlan !== plan.name}
                >
                  {selectedPlan === plan.name ? "Selected" : "Select"}
                </Button>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 