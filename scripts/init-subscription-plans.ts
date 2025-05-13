import { ConvexClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

const client = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function initSubscriptionPlans() {
  try {
    // Create Hobby (Free) Plan
    await client.mutation(api.subscriptions.createPlan, {
      name: 'Hobby',
      price: 0,
      interval: 'month',
      features: [
        'Pro two-week trial',
        '2000 completions/month',
        '50 slow requests/month',
      ],
      isActive: true,
      isFree: true,
    });

    // Create Pro Plan
    await client.mutation(api.subscriptions.createPlan, {
      name: 'Pro',
      price: 20,
      interval: 'month',
      features: [
        'Everything in Hobby',
        'Unlimited completions',
        '500 fast requests/month',
        'Unlimited slow requests',
        'Max mode (enhanced AI)',
        'Usage-based pricing after 500 fast requests ($0.04/request)'
      ],
      stripePriceId: process.env.STRIPE_PRO_PRICE_ID!,
      stripeProductId: process.env.STRIPE_PRO_PRODUCT_ID!,
      isActive: true,
    });

    // Create Business Plan
    await client.mutation(api.subscriptions.createPlan, {
      name: 'Business',
      price: 40,
      interval: 'month',
      features: [
        'Everything in Pro',
        'Enforce privacy mode org-wide',
        'Centralized team billing',
        'Admin dashboard with usage stats',
        'SAML/OIDC SSO',
      ],
      stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID!,
      stripeProductId: process.env.STRIPE_BUSINESS_PRODUCT_ID!,
      isActive: true,
      isPerSeat: true,
    });

    console.log('Subscription plans initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize subscription plans:', error);
    process.exit(1);
  }
}

initSubscriptionPlans();