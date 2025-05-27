/**
 * Subscription API utility functions
 * 
 * This module provides utility functions for interacting with the backend subscription API.
 * It handles all subscription-related API calls, including creating checkout sessions,
 * managing subscriptions, and checking subscription status.
 */

import { extractAuthInfo } from './api-helpers-server';

// Constants
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const API_PREFIX = '/api/v1'; // Based on the backend main.py configuration

// Types
export interface SubscriptionPlan {
  name: string;
  price_id: string;
  product_id: string;
  amount: number;
  currency: string;
  interval: string;
  features: string[];
}

export interface SubscriptionStatus {
  success: boolean;
  is_subscribed: boolean;
  plan_type: string;
  plan_name?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  trial_end?: string;
  usage?: {
    used: number;
    limit: number;
    remaining: number;
    reset_date?: string;
  };
}

export interface PaymentLinkResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    url: string;
    session_id: string;
  };
}

export interface PortalSessionResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    url: string;
    session_id: string;
  };
}

export interface UsageSummary {
  success: boolean;
  total_usage: number;
  usage_records: Array<{
    timestamp: string;
    quantity: number;
  }>;
}

/**
 * Makes an API call to the backend subscription service
 * 
 * @param endpoint - The API endpoint to call (without the API_PREFIX)
 * @param method - The HTTP method to use
 * @param apiKey - The API key for authentication
 * @param body - Optional request body
 * @returns The API response and data
 */
async function callSubscriptionAPI(endpoint: string, method: string, apiKey: string, body?: any) {
  const url = `${BACKEND_URL}${API_PREFIX}${endpoint}`;
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] Calling subscription API: ${method} ${endpoint}`, {
    timestamp: new Date().toISOString(),
  });
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    let responseData;
    try {
      responseData = await response.json();
    } catch {
      // If not JSON, try to get text
      const text = await response.text();
      responseData = { error: text || 'Unknown error' };
    }
    
    if (!response.ok) {
      console.error(`[${requestId}] Subscription API error:`, {
        status: response.status,
        endpoint,
        error: responseData?.error || 'Unknown error'
      });
    } else {
      console.log(`[${requestId}] Subscription API success:`, {
        status: response.status,
        endpoint
      });
    }
    
    return { response, data: responseData };
  } catch (error) {
    console.error(`[${requestId}] Subscription API call failed:`, {
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Creates a customer in Stripe
 * 
 * @param apiKey - The API key for authentication
 * @param userId - The user ID
 * @param email - The user's email
 * @param name - The user's name (optional)
 * @returns The customer object
 */
export async function createCustomer(
  apiKey: string,
  userId: string,
  email: string,
  name?: string
): Promise<any> {
  const { response, data } = await callSubscriptionAPI(
    '/subscription/customer',
    'POST',
    apiKey,
    {
      user_id: userId,
      email: email,
      name: name || ''
    }
  );
  
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to create customer');
  }
  
  return data;
}

/**
 * Creates a checkout session for a subscription
 * 
 * @param apiKey - The API key for authentication
 * @param userId - The user ID
 * @param planId - The plan ID or price ID
 * @returns The checkout redirect URL
 */
export interface CheckoutSessionResponse {
  client_secret: string;
  session_id: string;
  [key: string]: any;
}

/**
 * Creates a checkout session for a subscription
 * 
 * @param apiKey - The API key for authentication
 * @param userId - The user ID
 * @param planId - The plan ID or price ID
 * @returns The checkout session response object
 */
export async function createCheckoutSession(
  apiKey: string,
  userId: string,
  email: string,
  name: string,
  planId: string,
): Promise<CheckoutSessionResponse> {
  try {
    const { response, data } = await callSubscriptionAPI(
      '/subscription/checkout-session',
      'POST',
      apiKey,
      {
        user_id: userId,
        email,
        name,
        price_id: planId,
      }
    );
    
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to create checkout session');
    }
    // Return the parsed backend response directly
    return data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Gets the subscription status for a user
 * 
 * @param apiKey - The API key for authentication
 * @param userId - The user ID
 * @returns The subscription status
 */
export async function getSubscriptionStatus(
  apiKey: string,
  userId: string
): Promise<SubscriptionStatus> {
  const { response, data } = await callSubscriptionAPI(
    `/subscription/status/${userId}`,
    'GET',
    apiKey
  );
  
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to get subscription status');
  }
  
  return data;
}

/**
 * Gets the usage summary for a user
 * 
 * @param apiKey - The API key for authentication
 * @param userId - The user ID
 * @param meterName - Optional meter name (default: "api_requests")
 * @returns The usage summary
 */
export async function getUsageSummary(
  apiKey: string,
  userId: string,
  meterName: string = 'api_requests'
): Promise<UsageSummary> {
  const { response, data } = await callSubscriptionAPI(
    `/subscription/usage/${userId}?meter_name=${meterName}`,
    'GET',
    apiKey
  );
  
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to get usage summary');
  }
  
  return data;
}

/**
 * Reports usage for a user
 * 
 * @param apiKey - The API key for authentication
 * @param userId - The user ID
 * @param quantity - The quantity to report (default: 1)
 * @param meterName - Optional meter name (default: "api_requests")
 * @returns The result of the usage reporting
 */
export async function reportUsage(
  apiKey: string,
  userId: string,
  quantity: number = 1,
  meterName: string = 'api_requests'
): Promise<any> {
  const { response, data } = await callSubscriptionAPI(
    '/subscription/report-usage',
    'POST',
    apiKey,
    {
      user_id: userId,
      quantity,
      meter_name: meterName
    }
  );
  
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to report usage');
  }
  
  return data;
}

/**
 * Gets the list of available subscription plans
 * 
 * @param apiKey - The API key for authentication
 * @returns The list of available subscription plans
 */
export async function getSubscriptionPlans(
  apiKey: string
): Promise<Record<string, SubscriptionPlan>> {
  const { response, data } = await callSubscriptionAPI(
    '/subscription/plans',
    'GET',
    apiKey
  );
  
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to get subscription plans');
  }
  
  // The backend wraps the plans in a data property
  if (data.success && data.data) {
    console.log('Plans data received:', data.data);
    return data.data;
  }
  
  console.error('Unexpected plans response format:', data);
  throw new Error('Invalid plans data format received from server');
}

/**
 * Cancels a subscription for a user
 * 
 * @param apiKey - The API key for authentication
 * @param userId - The user ID
 * @param cancelAtPeriodEnd - Whether to cancel at the end of the current period (default: true)
 * @param cancellationReason - Optional reason for cancellation
 * @returns The result of the cancellation
 */
export async function cancelSubscription(
  apiKey: string,
  userId: string,
  cancelAtPeriodEnd: boolean = true,
  cancellationReason?: string
): Promise<any> {
  const { response, data } = await callSubscriptionAPI(
    '/subscription/cancel',
    'POST',
    apiKey,
    {
      user_id: userId,
      cancel_at_period_end: cancelAtPeriodEnd,
      cancellation_reason: cancellationReason
    }
  );
  
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to cancel subscription');
  }
  
  return data;
}

/**
 * Updates the payment method for a user's subscription
 * 
 * @param apiKey - The API key for authentication
 * @param userId - The user ID
 * @param paymentMethodId - The Stripe payment method ID
 * @returns The result of the update
 */
export async function updatePaymentMethod(
  apiKey: string,
  userId: string,
  paymentMethodId: string
): Promise<any> {
  const { response, data } = await callSubscriptionAPI(
    '/subscription/payment-method',
    'POST',
    apiKey,
    {
      user_id: userId,
      payment_method_id: paymentMethodId
    }
  );
  
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to update payment method');
  }
  
  return data;
}

/**
 * Updates the quantity for a user's subscription
 * 
 * @param apiKey - The API key for authentication
 * @param userId - The user ID
 * @param quantity - The new quantity
 * @returns The result of the update
 */
export async function updateQuantity(
  apiKey: string,
  userId: string,
  quantity: number
): Promise<any> {
  const { response, data } = await callSubscriptionAPI(
    '/subscription/quantity',
    'POST',
    apiKey,
    {
      user_id: userId,
      quantity
    }
  );
  
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to update quantity');
  }
  
  return data;
}

/**
 * Checks the rate limit for a user
 * 
 * @param apiKey - The API key for authentication
 * @param userId - The user ID
 * @returns The rate limit information
 */
export async function checkRateLimit(
  apiKey: string,
  userId: string
): Promise<any> {
  try {
    const { response, data } = await callSubscriptionAPI(
      `/subscription/rate-limit?user_id=${userId}`,
      'GET',
      apiKey
    );

    if (!response.ok) {
      throw new Error(`Failed to check rate limit: ${data.error || response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('Error checking rate limit:', error);
    throw error;
  }
}

/**
 * Creates a customer portal session for managing subscriptions
 * 
 * @param apiKey - The API key for authentication
 * @param userId - The user ID
 * @param email - The user's email
 * @param returnUrl - Optional URL to redirect to after the portal session
 * @returns The portal session response with URL to redirect to
 */
export async function createCustomerPortalSession(
  apiKey: string,
  userId: string,
  email: string,
  returnUrl?: string
): Promise<PortalSessionResponse> {
  try {
    const { response, data } = await callSubscriptionAPI(
      '/subscription/portal-session',
      'POST',
      apiKey,
      {
        user_id: userId,
        email: email,
        return_url: returnUrl
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create portal session: ${data.error || response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
}
