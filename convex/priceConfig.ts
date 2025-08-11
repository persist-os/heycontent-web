/**
 * Subscription Pricing Configuration
 * 
 * This file defines the pricing tiers and limits for different subscription plans.
 * The configuration must stay synchronized with the backend pricing system.
 * 
 * Plan Structure:
 * - Basic: Entry-level plan with limited requests
 * - Pro: Advanced plan with higher limits and yearly discount
 * 
 * Usage Tracking:
 * - includedRequests: Number of API requests included in the plan
 * - overage_rate: Cost per additional request beyond the limit
 */
export const PRICE_CONFIG = {
  "basic": {
    "monthly": {
      "includedRequests": 100,
      "overage_rate": 0.025,
    },
  },
  "pro": {
    "monthly": {
      "includedRequests": 1000,
      "overage_rate": 0.020,
    },
    "yearly": {
      "includedRequests": 12000,
      "overage_rate": 0.020,
    },
  },
} as const;

type PlanType = keyof typeof PRICE_CONFIG;
type IntervalType = 'monthly' | 'yearly';

/**
 * Get pricing information for a specific plan and billing interval
 * 
 * This function retrieves the pricing configuration for a given subscription plan.
 * It's used throughout the system to determine user limits and overage costs.
 * 
 * @param plan - The subscription plan (basic, pro)
 * @param interval - The billing interval (monthly, yearly)
 * @returns Pricing configuration object with limits and rates
 * @throws Error if plan or interval is invalid
 */
export function getPriceInfo(plan: string, interval: IntervalType) {
  const planConfig = PRICE_CONFIG[plan as PlanType];
  if (!planConfig) {
    throw new Error(`Invalid plan: ${plan}`);
  }
  const intervalConfig = planConfig[interval];
  if (!intervalConfig) {
    throw new Error(`Invalid interval: ${interval} for plan ${plan}`);
  }
  return intervalConfig;
}
