"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/app/context/auth-context';

import WaitlistScreen from "./waitlist-screen";
import UpgradeModal from "@/app/dashboard/_components/settings-screen/tabs/subscription/upgrade-modal";

interface RegisterScreenProps {
  onSuccess?: (apiKey: string) => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSuccess }) => {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [finalApiKey, setFinalApiKey] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const createPersona = useMutation(api.personas.createPersona);
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
  const handleRegisterSuccess = () => {
    setStep('personas');
  };

  // Registration form state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [referralCodeValid, setReferralCodeValid] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [currentPersona, setCurrentPersona] = useState("");
  const [futureVision, setFutureVision] = useState("");
  const [personaLoading, setPersonaLoading] = useState(false);
  const [personaSuccess, setPersonaSuccess] = useState<string | null>(null);
  const [personaError, setPersonaError] = useState<string | null>(null);
  
  // Use the Convex query to check referral code
  const checkReferralCode = useQuery(api.userQueries.checkReferralCode, 
    referredBy ? { referralCode: referredBy } : "skip"
  );

  // Function to validate referral code
  const validateReferralCode = (code: string) => {
    if (!code) {
      setError("Referral code is required");
      setReferralCodeValid(false);
      return false;
    }
    
    if (checkReferralCode === undefined) {
      // Still loading
      return false;
    }
    
    if (checkReferralCode === null) {
      // Query skipped
      return false;
    }
    
    if (checkReferralCode.valid) {
      setError(null);
      setReferralCodeValid(true);
      // Ensure referredBy is properly set to the validated code
      setReferredBy(code);
      return true;
    } else {
      setError("Invalid referral code");
      setReferralCodeValid(false);
      return false;
    }
  };

  const handleSavePersona = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonaLoading(true);
    setPersonaSuccess(null);
    setPersonaError(null);
    try {
      if (!user) throw new Error("You must be logged in to save your persona.");
      await createPersona({
        userId: user.uid,
        preferredName: name,
        currentPersona,
        futureVision,
      });
      setPersonaSuccess("Persona saved!");
    } catch (err: any) {
      setPersonaError(err.message || "Failed to save persona.");
    } finally {
      setPersonaLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    localStorage.removeItem('apiKey');
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    // Validate referral code first
    const isCodeValid = validateReferralCode(referredBy);
    if (!isCodeValid) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          username,
          referredBy,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }
      if (data.customToken) {
        const { getAuth, signInWithCustomToken } = await import('firebase/auth');
        const auth = getAuth();
        try {
          await signInWithCustomToken(auth, data.customToken);
        } catch (err: any) {
          setError('Firebase sign-in with custom token failed: ' + (err.message || err.code));
          setIsLoading(false);
          return;
        }
        let idToken: string | undefined;
        try {
          idToken = await auth.currentUser?.getIdToken(true);
        } catch (err: any) {
          setError('Failed to get Firebase ID token: ' + (err.message || err.code));
          setIsLoading(false);
          return;
        }
        if (idToken) {
          const apiKeyResponse = await fetch('/api/auth/firebase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idToken,
              action: 'getApiKey'
            }),
          });
          const apiKeyData = await apiKeyResponse.json();
          if (apiKeyResponse.ok && apiKeyData.apiKey) {
            localStorage.setItem('apiKey', JSON.stringify(apiKeyData.apiKey));
          } else if (!apiKeyResponse.ok) {
            setError(apiKeyData.error || 'Failed to get API key');
            setIsLoading(false);
            return;
          }
        }
      }
      if (data.apiKey) {
        localStorage.setItem('apiKey', JSON.stringify(data.apiKey));
      }
      handleRegisterSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
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
          <form onSubmit={handleSubmit} className="space-y-4 bg-white shadow-lg rounded-xl p-4 sm:p-8">
            <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Referral Code</label>
              <input
                type="text"
                value={referredBy}
                onChange={e => {
                  setReferredBy(e.target.value);
                  setReferralCodeValid(false); // Reset validation when code changes
                }}
                className={`w-full border rounded px-3 py-2 ${referralCodeValid ? 'border-green-500' : ''}`}
                placeholder="Enter your referral code"
                required
              />
              {checkReferralCode === undefined && referredBy && <div className="text-sm text-gray-500 mt-1">Validating code...</div>}
              {referralCodeValid && <div className="text-sm text-green-500 mt-1">Referral code valid!</div>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border rounded px-3 py-2 pr-10"
                  required
                />
                <span className="absolute right-2 top-2 text-gray-400">
                  <Mail size={18} />
                </span>
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border rounded px-3 py-2 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Register'}
            </button>
            <div className="mt-4 text-center">
              <a href="/auth/login" className="text-blue-600 hover:underline">
                Already have an account? Sign In
              </a>
            </div>
          </form>
        )}
        {step === 'personas' && (
          <form onSubmit={e => { e.preventDefault(); handlePersonaComplete(); }} className="space-y-4 bg-white shadow-lg rounded-xl p-4 sm:p-8">
            <h2 className="text-2xl font-bold mb-4 text-center">Your Creator Persona</h2>
            <p className="text-center text-gray-600 mb-4">
              <strong>What is a Persona?</strong> <br />
              This is a personal snapshot of who you are and who you want to become. We share this with your HeyContent chat so it can better understand and support you. You can keep it simple or get creative—it's all about you!
            </p>
            <div>
              <label htmlFor="currentPersona" className="block text-sm font-medium mb-1">Current Persona</label>
              <div className="relative">
                <textarea
                  id="currentPersona"
                  value={currentPersona}
                  onChange={e => setCurrentPersona(e.target.value.slice(0, 500))}
                  className="w-full border rounded px-3 py-2 min-h-[90px] resize-none pr-12"
                  rows={3}
                  maxLength={500}
                  required
                />
                <span className="absolute bottom-2 right-3 text-xs text-gray-400 bg-white bg-opacity-80 px-1 rounded">
                  {currentPersona.length}/500
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  Example:
                  <span className="italic block mt-1">
                    "I'm a lifestyle content creator who loves sharing my daily routines, travel adventures, and wellness tips. I enjoy connecting with my audience through authentic stories and inspiring others to live their best lives."
                  </span>
                </span>
              </div>
            </div>
            <div>
              <label htmlFor="futureVision" className="block text-sm font-medium mb-1">Future Vision</label>
              <div className="relative">
                <textarea
                  id="futureVision"
                  value={futureVision}
                  onChange={e => setFutureVision(e.target.value.slice(0, 500))}
                  className="w-full border rounded px-3 py-2 min-h-[90px] resize-none pr-12"
                  rows={3}
                  maxLength={500}
                  required
                />
                <span className="absolute bottom-2 right-3 text-xs text-gray-400 bg-white bg-opacity-80 px-1 rounded">
                  {futureVision.length}/500
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  Example:
                  <span className="italic block mt-1">
                    "I want to build a global brand that empowers my followers to feel confident and creative. My dream is to inspire millions, launch my own product line, and collaborate with top creators and brands around the world."
                  </span>
                </span>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
              disabled={personaLoading}
            >
              {personaLoading ? 'Saving...' : 'Continue'}
            </button>
            {personaSuccess && <div className="text-green-500 text-sm">{personaSuccess}</div>}
            {personaError && <div className="text-red-500 text-sm">{personaError}</div>}
            <button
              type="button"
              className="w-full mt-2 bg-gray-200 text-gray-700 py-2 rounded border border-gray-300 hover:bg-gray-100"
              onClick={() => setStep('payment')}
            >
              Skip this and add in settings later
            </button>
          </form>
        )}
        {step === 'waitlist' && (
          <WaitlistScreen onComplete={handleWaitlistComplete} />
        )}
      </div>
    </div>
  );
};

export default RegisterScreen;
