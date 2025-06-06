"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseAuth } from '@/app/lib/firebase';
import { WaitlistButton } from '@/components/ui/WaitlistButton';
import { Logo } from '@/components/ui/logo';
import { motion } from "framer-motion";

interface LoginScreenProps {
  onSuccess?: (apiKey: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    localStorage.removeItem('apiKey');
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      // Use Firebase Auth to validate credentials
      let auth;
      try {
        auth = getFirebaseAuth();
      } catch (e) {
        setError('Firebase Auth not initialized');
        setIsLoading(false);
        return;
      }
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        setError('Invalid email or password.');
        setIsLoading(false);
        return;
      }
      const user = userCredential.user;
      if (!user) {
        setError('Authentication failed: No user returned.');
        setIsLoading(false);
        return;
      }
      // Get ID token
      let idToken: string;
      try {
        idToken = await user.getIdToken(true);
      } catch (err: any) {
        setError('Failed to get Firebase ID token: ' + (err.message || err.code));
        setIsLoading(false);
        return;
      }
      // Send ID token to backend
      const apiKeyResponse = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const apiKeyData = await apiKeyResponse.json();
      if (apiKeyResponse.ok) {
        if (apiKeyData.apiKey) {
          localStorage.setItem('apiKey', JSON.stringify(apiKeyData.apiKey));
        }
        if (apiKeyData.redirect) {
          window.location.href = apiKeyData.redirect;
          return;
        }
      } else {
        setError(apiKeyData.error || 'Failed to get API key');
        setIsLoading(false);
        return;
      }
      if (onSuccess) onSuccess(apiKeyData.apiKey || "");
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F8F0F9] to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
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
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 pl-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                placeholder="Enter your email"
                title="Email address"
              />
              <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 pl-11 pr-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                placeholder="Enter your password"
                title="Password"
              />
              <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <button
                type="button"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="space-y-4">
            <div className="text-center">
              <a href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                Forgot your password?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>
            <div className="text-center">
              <a href="/auth/register" className="text-sm text-gray-600 hover:text-gray-900">
                Don't have an account? <span className="text-blue-600 hover:text-blue-700 font-medium">Sign up</span>
              </a>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center mb-3">
                Need access?<br />
                Join the waitlist below, or ask a friend for their invite code.
              </p>
              <div className="flex justify-center">
                <WaitlistButton />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
