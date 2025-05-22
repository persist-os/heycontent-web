"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/context/auth-context";
import { getApiKey } from '@/app/lib/api-helpers';
import CheckoutCard from "./cards/CheckoutCard"

interface CheckoutFormProps {
  planId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Using direct Stripe approach to avoid React integration issues
export const CheckoutForm: React.FC<CheckoutFormProps> = ({ planId, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const checkoutMountedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  // Only set isMountedRef true/false for race condition safety
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Handle URL parameters for success/cancel
  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const subscriptionStatus = urlParams.get('subscription');
    if (subscriptionStatus === 'success') {
      onSuccess?.();
    } else if (subscriptionStatus === 'canceled') {
      onCancel?.();
    }
    // Clean up embedded checkout on unmount
    return () => {
      const checkoutDiv = document.getElementById('checkout');
      if (checkoutDiv) checkoutDiv.innerHTML = '';
      checkoutMountedRef.current = false;
    };
  }, [onSuccess, onCancel]);

  return (
    <div className="min-h-[400px] bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
      {loading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Preparing checkout...</span>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
          <p className="font-medium">Error loading checkout</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      )}
      <CheckoutCard planId={planId} />
    </div>
  );
};
