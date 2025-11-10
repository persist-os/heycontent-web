"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/app/context/auth-context';
import UpgradeModal from "@/app/settings/tabs/subscription/upgrade-modal";
import { RegistrationForm } from './steps/RegistrationForm';
import { getApiKey } from '@/app/lib/api-helpers';
import { handleGoogleRedirectResult } from '@/app/lib/google-auth';
import { Logo } from '@/components/ui/logo';
import { motion } from "framer-motion";
import { T } from '@/components/translation';
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";

interface RegisterScreenProps {
  onSuccess?: (apiKey: string) => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSuccess }) => {
  const [finalApiKey, setFinalApiKey] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [name, setName] = useState(""); // Need to track name for persona step
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [processingGoogleAuth, setProcessingGoogleAuth] = useState(false);
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const initializeFreeTier = useMutation(api.subscriptionQueries.initializeFreeTier);
  
  const [step, setStep] = useState<'register' | 'payment' | 'chat'>('register');

  useEffect(() => {
    let mounted = true;
    
    // Check for Google OAuth redirect result on mount
    (async () => {
      // First check if we're returning from Google OAuth
      try {
        setProcessingGoogleAuth(true);
        const redirectResult = await handleGoogleRedirectResult();
        
        if (!mounted) return;
        
        if (redirectResult.success && redirectResult.redirect) {
          // Successfully authenticated via Google redirect
          window.location.href = redirectResult.redirect;
          return;
        } else {
          // No redirect result (normal page load) or error
          setProcessingGoogleAuth(false);
        }
      } catch (err) {
        console.error('Error checking Google redirect:', err);
        if (mounted) {
          setProcessingGoogleAuth(false);
        }
      }
      
      // Check URL step parameter
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
      
      // Check if user is already authenticated
      // If they are, redirect to dashboard (middleware and backend will handle subscription check)
      try {
        const { getFirebaseAuth } = await import('@/app/lib/firebase');
        const auth = getFirebaseAuth();
        const currentUser = auth.currentUser;
        
        if (currentUser && mounted) {
          // User is already logged in, redirect to dashboard
          // The backend will handle subscription check and redirect to /settings if needed
          window.location.href = '/dashboard';
        }
      } catch (err) {
        // Ignore errors checking auth state - allow registration to proceed
      }
    })();
    
    return () => { mounted = false };
  }, []);

  // Handle registration success - auto-initialize free tier
  const handleRegisterSuccess = async (
    registeredName: string, 
    apiKey: string,
    userId: string,
    userEmail: string
  ) => {
    setName(registeredName);
    setRegistrationSuccess(true);
    
    // Auto-initialize free tier - DIRECT CONVEX CALL (no backend)
    try {
      const result = await initializeFreeTier({ userId });
    } catch (error) {
      console.error('[Registration] Error during free tier init:', error);
      // Non-blocking: user can still proceed, middleware will enforce limits
    }
  };

  const handleContinueAfterSuccess = () => {
    setRegistrationSuccess(false);
    // Go straight to dashboard, skip plan selection
    router.push("/dashboard?welcome=true");
  };

  // Show loading state while processing Google OAuth redirect
  if (processingGoogleAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background/80 via-muted/20 to-background/80 p-4">
        <div className="w-full max-w-md text-center">
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 2, 0, -2, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Logo className="h-12 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            <T context="heading.auth.completing-registration">Completing registration...</T>
          </h2>
          <p className="text-muted-foreground">
            <T context="message.auth.verify-google">Please wait while we verify your Google account.</T>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background/80 via-muted/20 to-background/80 p-4">
      <div className="w-full max-w-md">
        {step === 'register' && !registrationSuccess && (
          <>
            <RegistrationForm onSuccess={handleRegisterSuccess} />
          </>
        )}
        {step === 'register' && registrationSuccess && (
          <div className="bg-background shadow-lg rounded-xl p-8 text-center border border-border">
            <h2 className="text-2xl font-bold mb-4 text-green-600 dark:text-green-400">
              <T context="heading.auth.registration-successful">Registration successful!</T>
            </h2>
            <p className="mb-6 text-foreground">
              <T context="message.auth.account-created">Your account has been created. Click below to continue.</T>
            </p>
            <button
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              onClick={handleContinueAfterSuccess}
            >
              <T context="button.auth.continue">Continue</T>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterScreen;
