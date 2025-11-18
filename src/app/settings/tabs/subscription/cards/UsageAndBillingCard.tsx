import { BaseCard } from '@/components/ui/base-card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import React from 'react';
import { T } from '@/components/translation/T';

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
    <BaseCard variant="usage" title="Usage & Billing">
      <div className="space-y-4 mt-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium"><T context="settings.subscription.usage.requests.label">Requests</T></span>
            <span className="font-mono">
              {total.toLocaleString()} / {included.toLocaleString()}
              {isOverLimit && ` (+${overage.toLocaleString()})`}
            </span>
          </div>
          
          <div className={cn(
            "relative h-2 w-full overflow-hidden rounded-full bg-muted",
            isOverLimit ? "bg-red-100" : isCloseToLimit ? "bg-yellow-100" : "bg-muted"
          )}>
            <div 
              className={cn(
                "h-full transition-all duration-300",
                isOverLimit ? "bg-red-500" : isCloseToLimit ? "bg-yellow-500" : "bg-accent"
              )}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {isOverLimit ? (
                <span className="text-red-600 font-medium">
                  <T context="settings.subscription.usage.overage">{overage.toLocaleString()} over limit (${(overage * 0.02).toFixed(2)})</T>
                </span>
              ) : isCloseToLimit ? (
                <span className="text-yellow-600">
                  <T context="settings.subscription.usage.remaining">{included - total} requests remaining</T>
                </span>
              ) : (
                <span>{included > 0 ? <T context="settings.subscription.usage.remaining">{included - total} requests remaining</T> : <T context="settings.subscription.usage.unlimited">Unlimited</T>}</span>
              )}
            </span>
            <span>
              {included > 0 ? <T context="settings.subscription.usage.percentage">{Math.round(usagePercentage)}% used</T> : <T context="settings.subscription.usage.no_limit">No limit</T>}
            </span>
          </div>
          
          {isOverLimit && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
              <p className="font-medium"><T context="settings.subscription.usage.exceeded">You've exceeded your included requests.</T></p>
              <p><T context="settings.subscription.usage.overage_rate">Additional requests are billed at $0.02 per request.</T></p>
            </div>
          )}
        </div>
      </div>
    </BaseCard>
  );
};