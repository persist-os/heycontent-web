"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/app/context/auth-context';

import WaitlistScreen from "./waitlist-screen";
import UpgradeModal from "@/app/dashboard/_components/settings-screen/tabs/subscription/upgrade-modal";
import RegistrationForm from "./steps/RegistrationForm";
import PersonaStep from "./steps/PersonaStep";

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
  
  const [step, setStep] = useState<'register' | 'personas' | 'payment' | 'waitlist' | 'chat'>('register');

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlStep = params.get("step");
      if (
        urlStep === "register" ||
        urlStep === "personas" ||
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
    setStep('personas');
  };

  const handleWaitlistComplete = (apiKey: string) => {
    setFinalApiKey(apiKey);
    if (onSuccess) onSuccess(apiKey);
    setStep('chat');
    router.push("/dashboard/chat");
  };

  const handleUpgradeClose = () => {
    // Prevent closing modal without completing checkout
    // Optionally, show a warning or keep modal open
  };

  const handlePersonaComplete = () => {
    setStep('payment');
  };

  const handlePersonaSkip = () => {
    setStep('payment');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
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
          <RegistrationForm onSuccess={handleRegisterSuccess} />
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
        
        {step === 'personas' && (
          <PersonaStep 
            name={name}
            onComplete={handlePersonaComplete}
            onSkip={handlePersonaSkip}
          />
        )}
        
        {step === 'waitlist' && (
          <WaitlistScreen onComplete={handleWaitlistComplete} />
        )}
      </div>
    </div>
  );
};

export default RegisterScreen;
