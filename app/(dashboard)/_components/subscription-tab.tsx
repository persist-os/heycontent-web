'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api as convexApi } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { CheckCircle2, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface SubscriptionTabProps {
  onCloseAction: () => Promise<void>;
}

interface Plan {
  _id: string;
  _creationTime: number;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  stripePriceId?: string;
  stripeProductId?: string;
  isActive: boolean;
  isFree?: boolean;
  isPerSeat?: boolean;
  createdAt: number;
  updatedAt: number;
}

interface PaymentMethod {
  _id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface CurrentSubscription {
  _id: string;
  _creationTime: number;
  userId: string;
  planId: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  teamId?: string;
  trialEndDate?: number;
  createdAt: number;
  updatedAt: number;
  plan: Plan | null;
}

const PaymentForm = ({ planId, onSuccess }: { planId: string; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const createSubscription = useMutation(convexApi.subscriptions.createSubscription);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/settings?subscription=success`,
        },
      });

      if (submitError) {
        setError(submitError.message || 'An error occurred');
      } else {
        onSuccess();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Subscribe'
        )}
      </Button>
    </form>
  );
};

export default function SubscriptionTab({ onCloseAction }: SubscriptionTabProps) {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const cancelSubscription = useMutation(convexApi.subscriptionActions.cancelSubscriptionAction);

  const plans: Plan[] = useQuery(convexApi.subscriptionQueries.getPlans) || [];
  const currentSubscription: CurrentSubscription | null | undefined = useQuery(convexApi.subscriptionQueries.getCurrentSubscription, {
    userId: user?.uid || '',
  });
  const paymentMethods: PaymentMethod[] = useQuery(convexApi.subscriptionQueries.getPaymentMethods, {
    userId: user?.uid || '',
  }) || [];
  const usage = useQuery(convexApi.usage.getCurrentUsage, { userId: user?.uid || '' });

  const handleUpgrade = async (planId: string) => {
    setSelectedPlan(planId);
    // In a real implementation, you would create a payment intent here
    // and get the client secret from your backend
  };

  const handleCancel = async () => {
    if (!user?.uid) return;
    try {
      await cancelSubscription({ userId: user.uid });
      // Refresh the subscription data
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    }
  };

  if (!plans) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-medium">
                  {currentSubscription?.plan?.name || 'Hobby (Free)'}
                </h3>
                <p className="text-sm text-gray-600">
                  {typeof currentSubscription?.plan?.price === 'number' && currentSubscription.plan.price === 0
                    ? 'Free'
                    : currentSubscription?.plan?.isPerSeat
                      ? `$${currentSubscription.plan.price ?? ''}/user/month`
                      : typeof currentSubscription?.plan?.price === 'number'
                        ? `$${currentSubscription.plan.price}/month`
                        : ''}
                </p>
                {/* Usage stats */}
                {usage && (
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <div>Fast Requests: <b>{usage.fastRequests}</b></div>
                    <div>Completions: <b>{usage.completions}</b></div>
                    <div>Slow Requests: <b>{usage.slowRequests}</b></div>
                    <div>Overage Charges: <b>${usage.overageCharges.toFixed(2)}</b></div>
                    <div>Next Reset: <b>{new Date(usage.nextResetDate).toLocaleDateString()}</b></div>
                  </div>
                )}
              </div>
              <Badge variant="outline">
                {currentSubscription?.status || 'Current'}
              </Badge>
            </div>
            {currentSubscription && (
              <div className="text-sm text-gray-600">
                <p>
                  Next billing date:{' '}
                  {currentSubscription.currentPeriodEnd ? new Date(currentSubscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                </p>
                {currentSubscription.trialEndDate && Date.now() < (currentSubscription.trialEndDate ?? 0) && (
                  <p className="text-blue-600 mt-2">
                    Trial ends: {currentSubscription.trialEndDate ? new Date(currentSubscription.trialEndDate).toLocaleDateString() : 'N/A'}
                  </p>
                )}
                {currentSubscription.cancelAtPeriodEnd && (
                  <p className="text-yellow-600 mt-2">
                    Your subscription will end at the end of the current billing period.
                  </p>
                )}
              </div>
            )}
            {currentSubscription && !currentSubscription.cancelAtPeriodEnd && !currentSubscription?.plan?.isFree && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleCancel}
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Upgrade Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan: Plan) => (
              <div key={plan._id} className="p-4 border rounded-lg">
                <div className="mb-4">
                  <h3 className="font-medium">{plan.name}</h3>
                  <p className="text-2xl font-bold mt-2">
                    {plan.isFree
                      ? 'Free'
                      : plan.isPerSeat
                        ? `$${plan.price}`
                        : `$${plan.price}`}
                    <span className="text-sm font-normal text-gray-600">
                      {plan.isFree ? '' : plan.isPerSeat ? '/user/month' : '/month'}
                    </span>
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  {plan.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade(plan._id)}
                  disabled={currentSubscription?.planId === plan._id}
                >
                  {currentSubscription?.planId === plan._id
                    ? 'Current Plan'
                    : plan.isFree
                      ? 'Free'
                      : 'Upgrade'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats (if available) */}
      {/* TODO: Add usage stats display here if you fetch usage data */}

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethods && paymentMethods.length > 0 ? (
            <div className="space-y-4">
              {paymentMethods.map((method: PaymentMethod) => (
                <div
                  key={method._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">
                        {method.brand.toUpperCase()} •••• {method.last4}
                      </p>
                      <p className="text-sm text-gray-600">
                        Expires {method.expMonth}/{method.expYear}
                      </p>
                    </div>
                  </div>
                  {method.isDefault && (
                    <Badge variant="default">Default</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
              <div>
                <h3 className="font-medium">No payment methods</h3>
                <p className="text-sm text-gray-600">
                  Add a payment method to upgrade your plan
                </p>
              </div>
              <Button variant="outline">Add Payment Method</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {selectedPlan && clientSecret && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Complete Your Subscription</h3>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm
                planId={selectedPlan}
                onSuccess={async () => {
                  setSelectedPlan(null);
                  setClientSecret(null);
                  await onCloseAction();
                }}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
} 