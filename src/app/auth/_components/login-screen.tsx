"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseAuth } from '@/app/lib/firebase';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4 bg-white shadow-lg rounded-xl p-4 sm:p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Sign In</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2 pr-10"
                required
                placeholder="Enter your email"
                title="Email address"
              />
              <span className="absolute right-2 top-2 text-gray-400">
                {/* Use lucide-react Mail icon if available */}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2 pr-10"
                required
                placeholder="Enter your password"
                title="Password"
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
            className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="mt-4 text-center">
            <a href="/auth/register" className="text-blue-600 hover:underline">
              Create an account
            </a>
            <div className="mt-2">
              <a href="/auth/forgot-password" className="text-blue-500 hover:underline">
                Forgot your password?
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
