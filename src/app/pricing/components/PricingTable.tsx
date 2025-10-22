'use client';

import React, { useState } from 'react';
import { PricingCard } from './PricingCard';
import { Button } from '../../../components/ui/button';
import { T } from '@/components/translation';

export function PricingTable() {
  const [showAnnual, setShowAnnual] = useState(false);

  const pricingTiers = [
    {
      name: 'Free',
      price: '$0',
      priceSubtext: '',
      annualPrice: undefined,
      description: '50 API calls',
      features: [
        '50 API calls',
        '~10 chat conversations',
        '~25 smart notes',
        'Full Crystal & Shard system',
        'All features unlocked',
        'No credit card required',
      ],
      ctaText: 'Start Free',
      ctaLink: '/auth/register',
      popular: false,
    },
    {
      name: 'Basic',
      price: '$10',
      priceSubtext: '/month',
      annualPrice: undefined, // No annual option for Basic
      description: '100 API calls per month + overage',
      features: [
        '~20 chat conversations/month',
        '~50 smart notes/month',
        'Advanced ambient insights',
        'Limited Living Projects',
        'Overage: $0.025 per API call',
        'Email support',
      ],
      ctaText: 'Get Basic',
      ctaLink: '/auth/register',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$25',
      priceSubtext: '/month',
      annualPrice: '$249',
      description: '1,000 API calls per month + overage',
      features: [
        '~200+ chat conversations/month',
        '~500+ smart notes/month',
        'Unlimited ambient insights',
        'Unlimited Living Projects',
        'Overage: $0.020 per API call',
        'Priority support',
        'Early access to features',
        'Lower overage rate',
      ],
      ctaText: 'Get Pro',
      ctaLink: '/auth/register',
      popular: true,
    },
  ];

  return (
    <div>
      {/* Monthly/Annual Toggle */}
      <div className="flex justify-center gap-4 mb-12">
        <Button
          variant={!showAnnual ? 'default' : 'outline'}
          onClick={() => setShowAnnual(false)}
          size="lg"
        >
          <T context="pricingTable.monthly">Monthly</T>
        </Button>
        <Button
          variant={showAnnual ? 'default' : 'outline'}
          onClick={() => setShowAnnual(true)}
          size="lg"
        >
          <T context="pricingTable.annual">Annual</T>
          <span className="ml-2 text-sm opacity-90">(<T context="pricingTable.save">Save 17%</T>)</span>
        </Button>
      </div>

      {/* Pricing Cards */}
      <div className={`grid gap-8 max-w-7xl mx-auto ${showAnnual ? 'md:grid-cols-1 max-w-md' : 'md:grid-cols-3'}`}>
        {pricingTiers
          .filter((tier) => !showAnnual || tier.annualPrice !== undefined)
          .map((tier) => (
            <PricingCard
              key={tier.name}
              {...tier}
              showAnnual={showAnnual}
            />
          ))}
      </div>

    </div>
  );
}
