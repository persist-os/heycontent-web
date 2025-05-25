import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import React from 'react';

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
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Account & Subscription</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {/* User Information Section */}
      <div className="font-medium">{user?.displayName || 'No name provided'}</div>
      <div className="text-sm text-gray-500">{user?.email || 'No email provided'}</div>
      
      {/* Subscription Plan Information */}
      <div className="mt-2">
        <span className="font-semibold">Plan:</span> {currentSubscription?.plan?.name || 'Not subscribed'}
        {currentSubscription?.plan?.price !== undefined && (
          <span className="ml-2 text-gray-500">
            ${currentSubscription.plan.price}
            {(() => {
              const interval = currentSubscription.plan.interval;
              if (interval === 'year' || interval === 'yearly') return '/year';
              if (interval === 'month' || interval === 'monthly') return '/month';
              return '/month';
            })()}
          </span>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-2">
        <Button 
          size="sm" 
          onClick={handleUpgrade}
          aria-label="Upgrade subscription plan"
        >
          Upgrade
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleManageSubscription}
          aria-label="Manage subscription settings"
        >
          Manage Subscription
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleOpenQuantityModal}
          aria-label="Change number of requests"
        >
          Change # of Requests
        </Button>
      </div>
    </CardContent>
  </Card>
);
