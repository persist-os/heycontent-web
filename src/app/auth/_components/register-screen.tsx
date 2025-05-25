"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

import WaitlistScreen from "./waitlist-screen";

interface RegisterScreenProps {
  onSuccess?: (apiKey: string) => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSuccess }) => {
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [finalApiKey, setFinalApiKey] = useState<string | null>(null);

  // Handle registration success
  const handleRegisterSuccess = () => {
    setShowWaitlist(true);
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
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        {!showWaitlist ? (
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
                // Using Convex real-time queries instead of onBlur validation
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
        ) : (
          <WaitlistScreen onComplete={handleWaitlistComplete} />
        )}
      </div>
    </div>
  );
};

export default RegisterScreen;
