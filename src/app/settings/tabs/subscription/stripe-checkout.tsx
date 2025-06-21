"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/context/auth-context";
import CheckoutCard from "./cards/CheckoutCard"

interface CheckoutFormProps {
  planId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  returnUrl?: string;
}

// Using direct Stripe approach to avoid React integration issues
export const CheckoutForm: React.FC<CheckoutFormProps> = ({ planId, onSuccess, onCancel, returnUrl }) => {
  const { firebaseUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const checkoutMountedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  // Only set isMountedRef true/false for race condition safety
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Handle URL parameters for success/cancel (no cleanup here)
  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const subscriptionStatus = urlParams.get('subscription');
    if (subscriptionStatus === 'success') {
      onSuccess?.();
    } else if (subscriptionStatus === 'canceled') {
      onCancel?.();
    }
  }, [onSuccess, onCancel]);

  // Cleanup embedded checkout on unmount only
  useEffect(() => {
    return () => {
      const checkoutDiv = document.getElementById('checkout');
      if (checkoutDiv) checkoutDiv.innerHTML = '';
      checkoutMountedRef.current = false;
    };
  }, []);

  return (
    <div className="w-full bg-card rounded-lg shadow-lg p-2 sm:p-4">
      
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
      <CheckoutCard planId={planId} returnUrl={returnUrl} />
    </div>
  );
};
