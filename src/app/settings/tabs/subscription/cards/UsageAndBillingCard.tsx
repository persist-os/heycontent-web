import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
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
  
  // Calculate usage percentage (capped at 100% for display)
  const usagePercentage = included > 0 ? Math.min((total / included) * 100, 100) : 0;
  
  // Determine if we're close to the limit (80% or more)
  const isCloseToLimit = included > 0 && total >= included * 0.8;
  const isOverLimit = overage > 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage & Billing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">API Requests</span>
            <span className="font-mono">
              {total.toLocaleString()} / {included.toLocaleString()}
              {isOverLimit && ` (+${overage.toLocaleString()})`}
            </span>
          </div>
          
          <div className={cn(
            "relative h-2 w-full overflow-hidden rounded-full bg-muted",
            isOverLimit ? "bg-destructive/10" : isCloseToLimit ? "bg-primary/20" : "bg-muted"
          )}>
            <div 
              className={cn(
                "h-full transition-all duration-300",
                isOverLimit ? "bg-destructive" : isCloseToLimit ? "bg-primary" : "bg-primary"
              )}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {isOverLimit ? (
                <span className="text-destructive font-medium">
                  {overage.toLocaleString()} over limit (${(overage * 0.02).toFixed(2)})
                </span>
              ) : isCloseToLimit ? (
                <span className="text-primary">
                  {included - total} requests remaining
                </span>
              ) : (
                <span>{included > 0 ? `${included - total} requests remaining` : 'Unlimited'}</span>
              )}
            </span>
            <span>
              {included > 0 ? `${Math.round(usagePercentage)}% used` : 'No limit'}
            </span>
          </div>
          
          {isOverLimit && (
            <div className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
              <p className="font-medium">You've exceeded your included requests.</p>
              <p>Additional requests are billed at $0.02 per request.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};