import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import React from 'react';

interface UsageAndBillingCardProps {
  usage: {
    total: number;
    included: number;
    overage: number;
  };
}

export const UsageAndBillingCard: React.FC<UsageAndBillingCardProps> = ({ usage }) => {
  const { total, included, overage } = usage;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage & Billing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Requests</span>
              <span>{total} / {included}</span>
            </div>
            <Progress value={included ? Math.min((total / included) * 100, 100) : 0} />
            <div className="text-xs text-gray-500 mt-1">
              {overage > 0 ? (
                <span className="text-red-500 font-semibold">Overage: {overage} requests</span>
              ) : (
                <>Requests included in your plan</>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
