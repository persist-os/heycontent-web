'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { T } from '@/components/translation';

export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'What happens when I hit my API call limit?',
      answer: 'Free tier: You\'ll be prompted to upgrade. Your data remains accessible, but AI features will be paused until you upgrade or the next billing cycle. Paid tiers: You\'ll continue to be billed for overage at the rates shown ($0.025 for Basic, $0.020 for Pro). You can set spending caps to prevent unexpected charges.',
    },
    {
      question: 'Can I switch plans anytime?',
      answer: 'Yes! You can upgrade or downgrade anytime. Upgrades take effect immediately. Downgrades take effect at the start of your next billing cycle. You keep all your data and conversations regardless of plan changes.',
    },
    {
      question: 'What\'s the difference between API calls and user actions?',
      answer: 'API calls power the AI features. One user action (like sending a chat message) typically equals 1 API call. More complex actions like generating ambient insights may use 3-5 calls. We show the exact cost for each action in our breakdown table above.',
    },
    {
      question: 'Do background processes count toward my limit?',
      answer: 'No. Automatic memory consolidation, passive context building, and reading your existing content are completely free. Only active AI-powered actions (chat, note analysis, insights generation) count toward your quota.',
    },
    {
      question: 'Can I buy extra API calls without upgrading?',
      answer: 'Not yet, but it\'s coming soon! For now, paid tiers (Basic and Pro) automatically bill overage at the stated rates. If you consistently exceed your quota, upgrading to the next tier is more cost-effective.',
    },
    {
      question: 'How do I track my usage?',
      answer: 'Your Settings page has a real-time usage dashboard showing your current consumption for the month.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) through Stripe.',
    },
  ];

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div key={index} className="border rounded-lg overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <span className="font-semibold pr-4">
              <T context={`pricingFaq.question${index + 1}`}>{faq.question}</T>
            </span>
            <ChevronDown 
              className={`w-5 h-5 shrink-0 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
            />
          </button>
          {openIndex === index && (
            <div className="px-4 pb-4 text-muted-foreground">
              <T context={`pricingFaq.answer${index + 1}`}>{faq.answer}</T>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}