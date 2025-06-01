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
  const router = useRouter();
  const { user } = useAuth();
  
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
        
        {step === 'register' && (
          <RegistrationForm onSuccess={handleRegisterSuccess} />
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
