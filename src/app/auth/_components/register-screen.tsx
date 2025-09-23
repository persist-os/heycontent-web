"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/app/context/auth-context';
import UpgradeModal from "@/app/settings/tabs/subscription/upgrade-modal";
import { RegistrationForm } from './steps/RegistrationForm';
import { getApiKey } from '@/app/lib/api-helpers';

interface RegisterScreenProps {
  onSuccess?: (apiKey: string) => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSuccess }) => {
  const [finalApiKey, setFinalApiKey] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [name, setName] = useState(""); // Need to track name for persona step
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const router = useRouter();
  const { firebaseUser } = useAuth();
  
  const [step, setStep] = useState<'register' | 'payment' | 'chat'>('register');

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlStep = params.get("step");
      if (
        urlStep === "register" ||
        urlStep === "payment" ||
        urlStep === "chat"
      ) {
        setStep(urlStep as typeof step);
      }
    }
  }, []);

  // Handle registration success
  const handleRegisterSuccess = (registeredName: string) => {
    setName(registeredName);
    setRegistrationSuccess(true);
  };

  const handleContinueAfterSuccess = () => {
    setRegistrationSuccess(false);
    setStep('payment');
    // Update URL to reflect current step
    const url = new URL(window.location.href);
    url.searchParams.set('step', 'payment');
    router.replace(url.toString());
  };

  const handleUpgradeClose = () => {
    // During registration, users MUST select a plan - no skipping allowed
    // This prevents bypassing the subscription requirement
    return;
  };

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free') {
      // Free tier selected - create free subscription first
      try {
        const apiKey = await getApiKey();
        if (!apiKey) {
          console.error('No API key found. Please log in again.');
          return;
        }
        
        // Call the free tier subscription endpoint
        const response = await fetch('/api/subscription/free-tier', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: firebaseUser?.uid,
            email: firebaseUser?.email || '',
            name: firebaseUser?.displayName || ''
          })
        });
        
        if (!response.ok) {
          console.error('Failed to create free subscription');
          return;
        }
        
        const result = await response.json();
        
        if (result.success) {
          // Free subscription created successfully - redirect to dashboard
          setStep('chat');
          router.push("/dashboard?welcome=true");
        } else {
          console.error('Failed to create free subscription:', result.error);
        }
      } catch (error) {
        console.error('Error creating free subscription:', error);
      }
    } else {
      // Paid plan selected - redirect to dashboard
      setStep('chat');
      router.push("/dashboard?welcome=true");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background/80 via-muted/20 to-background/80 p-4">
      <div className="w-full max-w-md">
        {step === 'payment' && (
          <div className="space-y-4">
            <UpgradeModal
              open={true}
              onClose={() => {}} // Disable closing during registration
              onSelectPlan={handleSelectPlan}
              context="registration"
            />
            <div className="text-center">
              <p className="text-muted-foreground mb-2 text-sm">
                Please select a plan to continue
              </p>
            </div>
          </div>
        )}
        
        {step === 'register' && !registrationSuccess && (
          <>
            <RegistrationForm onSuccess={handleRegisterSuccess} />
          </>
        )}
        {step === 'register' && registrationSuccess && (
          <div className="bg-background shadow-lg rounded-xl p-8 text-center border border-border">
            <h2 className="text-2xl font-bold mb-4 text-green-600 dark:text-green-400">Registration successful!</h2>
            <p className="mb-6 text-foreground">Your account has been created. Click below to continue.</p>
            <button
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              onClick={handleContinueAfterSuccess}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterScreen;
