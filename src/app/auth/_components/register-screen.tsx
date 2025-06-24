"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/app/context/auth-context';
import { WaitlistButton } from '@/app/waitlist/_components/WaitlistButton';

import WaitlistScreen from "./waitlist-screen";
import UpgradeModal from "@/app/settings/tabs/subscription/upgrade-modal";
import { RegistrationForm } from './steps/RegistrationForm';

interface RegisterScreenProps {
  onSuccess?: (apiKey: string) => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSuccess }) => {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [finalApiKey, setFinalApiKey] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [name, setName] = useState(""); // Need to track name for persona step
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const router = useRouter();
  const { firebaseUser } = useAuth();
  
  const [step, setStep] = useState<'register' | 'payment' | 'waitlist' | 'chat'>('register');

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlStep = params.get("step");
      if (
        urlStep === "register" ||
        urlStep === "payment" ||
        urlStep === "waitlist" ||
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

  const handleWaitlistComplete = (apiKey: string) => {
    setFinalApiKey(apiKey);
    if (onSuccess) onSuccess(apiKey);
    setStep('chat');
    // Redirect to chat with a welcome parameter to trigger the onboarding message
    router.push("/dashboard/chat?welcome=true");
  };

  const handleUpgradeClose = () => {
    // Prevent accidental closing of the payment modal
    // We'll keep this empty to ensure users complete the payment flow
    // The modal will close automatically after successful payment
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F8F0F9] to-blue-50 p-4 light-mode-forced" style={{
      '--background': '0 0% 100%', // Force white background
      '--foreground': '240 10% 3.9%', // Force dark text
      '--card': '0 0% 100%',
      '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '240 10% 3.9%',
      '--primary': '55 95% 58%', // Keep HeyContent yellow
      '--primary-foreground': '0 0% 0%',
      '--secondary': '240 4.8% 95.9%',
      '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%',
      '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '55 95% 58%',
      '--accent-foreground': '0 0% 0%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%',
      '--input': '240 5.9% 90%',
      '--ring': '55 95% 58%',
    } as React.CSSProperties}>
      <div className="w-full max-w-md">
        {step === 'payment' && (
          <UpgradeModal
            open={true}
            onClose={handleUpgradeClose}
            onSelectPlan={() => setStep('waitlist')}
            context="registration"
          />
        )}
        
        {step === 'register' && !registrationSuccess && (
          <>
            <RegistrationForm onSuccess={handleRegisterSuccess} />
            <div className="mt-6 text-center">
              <p className="text-gray-600 mb-2 text-sm">
                Need access?<br />
                Join the waitlist below, or ask a friend for their invite code.
              </p>
              <WaitlistButton />
            </div>
          </>
        )}
        {step === 'register' && registrationSuccess && (
          <div className="bg-white shadow-lg rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-green-600">Registration successful!</h2>
            <p className="mb-6 text-gray-700">Your account has been created. Click below to continue.</p>
            <button
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              onClick={handleContinueAfterSuccess}
            >
              Continue
            </button>
          </div>
        )}
        
        {step === 'waitlist' && (
          <WaitlistScreen onComplete={handleWaitlistComplete} />
        )}
      </div>
    </div>
  );
};

export default RegisterScreen;
