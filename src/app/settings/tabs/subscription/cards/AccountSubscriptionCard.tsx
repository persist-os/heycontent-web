import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import React from 'react';
import { User } from 'lucide-react';
import { T } from '@/components/translation/T';

/**
 * Type definition for the user object
 */
interface User {
  displayName?: string;
  email?: string;
  [key: string]: any; // Allow for additional user properties
}

/**
 * Type definition for the subscription plan
 */
interface SubscriptionPlan {
  name?: string;
  price?: number;
  interval?: string;
  [key: string]: any; // Allow for additional plan properties
}

/**
 * Type definition for the current subscription object
 */
interface CurrentSubscription {
  plan?: SubscriptionPlan;
  [key: string]: any; // Allow for additional subscription properties
}

/**
 * Props for the AccountSubscriptionCard component
 */
interface AccountSubscriptionCardProps {
  /** User information including display name and email */
  user: User;
  /** Current subscription details including plan information */
  currentSubscription: CurrentSubscription;
  /** Callback function triggered when upgrade button is clicked */
  handleUpgrade: () => void;
  /** Callback function triggered when changing request quantity */
  handleOpenQuantityModal: () => void;
  /** Callback function triggered when managing subscription */
  handleManageSubscription: () => void;
}

/**
 * Displays the user's account information and subscription details in a card layout.
 * Provides actions for upgrading, managing subscription, and changing request quantity.
 * 
 * @component
 * @param {AccountSubscriptionCardProps} props - Component props
 * @returns {JSX.Element} The rendered account subscription card
 * 
 * @example
 * <AccountSubscriptionCard
 *   user={{ displayName: 'John Doe', email: 'john@example.com' }}
 *   currentSubscription={{
 *     plan: { name: 'Pro', price: 25 }
 *   }}
 *   handleUpgrade={handleUpgrade}
 *   handleOpenQuantityModal={handleOpenQuantity}
 *   handleManageSubscription={handleManage}
 * />
 */
export const AccountSubscriptionCard: React.FC<AccountSubscriptionCardProps> = ({
  user,
  currentSubscription,
  handleUpgrade,
  handleOpenQuantityModal,
  handleManageSubscription,
}) => {
  // Determine plan and subscription status
  const plan = currentSubscription?.plan;
  const isSubscribed = !!plan && !!plan.name;
  const isMetered = plan?.is_metered;
  // For demo: assume 'Pro' is highest plan
  const isOnHighestPlan = plan?.name === 'Pro';

  return (
    <Card className="w-full p-4 sm:p-6 rounded-xl shadow-md bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg sm:text-xl font-bold"><T context="settings.subscription.account.title">Account & Subscription</T></CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* User Information Section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">{user?.displayName || <T context="settings.subscription.account.user.default">User</T>}</h3>
              <div className="text-sm text-muted-foreground break-all">{user?.email || <T context="settings.subscription.account.email.missing">No email provided</T>}</div>
            </div>
          </div>
        </div>
        {/* Subscription Plan Information */}
        <div className="mt-2 text-base">
          <span className="font-semibold"><T context="settings.subscription.account.plan.label">Plan:</T></span>{' '}
          {isSubscribed ? (
            <>
              {plan.name}
              {plan.price !== undefined && (
                <span className="ml-2 text-muted-foreground">
                  {typeof plan.price === 'number'
                    ? `$${plan.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                    : plan.price}
                  {(() => {
                    const interval = plan.interval;
                    if (interval === 'year' || interval === 'yearly') return '/year';
                    if (interval === 'month' || interval === 'monthly') return '/month';
                    return '';
                  })()}
                </span>
              )}
            </>
          ) : (
            <T context="settings.subscription.account.plan.not_subscribed">Not subscribed</T>
          )}
        </div>
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          {!isSubscribed ? (
            <Button
              size="lg"
              variant="default"
              className="min-w-[120px]"
              onClick={handleUpgrade}
              aria-label="Subscribe to a paid plan"
            >
              <T context="button.subscribe.now">Subscribe Now</T>
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="min-w-[120px]"
              onClick={handleManageSubscription}
              aria-label="Manage subscription settings"
            >
              <T context="button.manage.subscription">Manage Subscription</T>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
