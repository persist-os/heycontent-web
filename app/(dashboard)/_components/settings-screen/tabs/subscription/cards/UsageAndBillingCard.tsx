import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import { Progress } from '@/src/components/ui/progress';
import React from 'react';

interface UsageAndBillingCardProps {
  usage: {
    fastRequests: number;
    slowRequests: number;
  };
}

export const UsageAndBillingCard: React.FC<UsageAndBillingCardProps> = ({ usage }) => (
  <Card>
    <CardHeader>
      <CardTitle>Usage & Billing</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Fast Requests</span>
            <span>{usage.fastRequests || 0} / 2000</span>
          </div>
          <Progress value={Math.min((usage.fastRequests || 0) / 2000 * 100, 100)} />
          <div className="text-xs text-gray-500 mt-1">Premium models (e.g., GPT-4, etc.) included in your plan</div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Other Models</span>
            <span>{usage.slowRequests || 0} / No Limit</span>
          </div>
          <Progress value={100} />
          <div className="text-xs text-gray-500 mt-1">Unlimited usage for mini/small models under your plan</div>
        </div>
      </div>
    </CardContent>
  </Card>
);
