'use client'

import React, { useState } from 'react';
import WaitlistScreen from './waitlist-screen';
import AuthForm from './auth-form';

interface AuthScreenProps {
  isLogin?: boolean;
  onSuccess?: (apiKey: string) => void;
}

export function AuthScreen({ isLogin = true, onSuccess }: AuthScreenProps) {
  const [showWaitlist, setShowWaitlist] = useState(false);

  // Called when AuthForm succeeds
  const handleAuthSuccess = () => {
    setShowWaitlist(true);
  };

  // Called when waitlist completes (optional: could use for redirect or notification)
  const handleWaitlistComplete = (finalApiKey: string) => {
    // Optionally, do something when waitlist finishes
    // For example, redirect or show a success toast
    if (onSuccess) onSuccess(finalApiKey);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      {!showWaitlist ? (
        <AuthForm isLogin={isLogin} onAuthSuccess={handleAuthSuccess} />
      ) : (
        <WaitlistScreen
          onComplete={handleWaitlistComplete}
          initialCount={23}
          minWaitTime={1500}
          apiKeyGenerationTime={3000}
        />
      )}
    </div>
  );
}