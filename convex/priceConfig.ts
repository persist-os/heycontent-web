// This should match the PRICE_CONFIG in the backend
// Update this whenever the backend price config changes

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
