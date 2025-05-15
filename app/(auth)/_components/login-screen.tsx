"use client";

import React, { useEffect, useState } from "react";


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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
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
          console.log('About to sign in with custom token...');
          await signInWithCustomToken(auth, data.customToken);
          console.log('Successfully signed in with custom token');
        } catch (err: any) {
          setError('Firebase sign-in with custom token failed: ' + (err.message || err.code));
          setIsLoading(false);
          console.error('signInWithCustomToken failed:', err);
          return;
        }
        
        // Force reload auth state
        try {
          console.log('Forcing auth state reload...');
          await auth.updateCurrentUser(auth.currentUser);
        } catch (e) {
          console.warn('Force reload failed:', e);
        }
        
        // GUARANTEED: Wait for auth.currentUser
        console.log('Initial auth.currentUser:', auth.currentUser);
        let user = auth.currentUser;
        let waitMs = 0;
        while (!user && waitMs < 5000) { // longer timeout
          console.log(`Waiting for user... (${waitMs}ms)`);
          await new Promise(res => setTimeout(res, 100));
          waitMs += 100;
          user = auth.currentUser;
        }
        
        if (!user) {
          console.error('CRITICAL: User not available after 5 seconds');
          setError('Authentication failed: Unable to get user after 5 seconds');
          setIsLoading(false);
          return;
        }
        
        console.log('Found user:', user.uid);
        
        // GUARANTEED: Get token with forced refresh
        let idToken: string;
        try {
          console.log('Getting ID token with forced refresh...');
          idToken = await user.getIdToken(true);
          console.log('ID token obtained successfully, length:', idToken.length);
        } catch (err: any) {
          console.error('getIdToken failed:', err);
          setError('Failed to get Firebase ID token: ' + (err.message || err.code));
          setIsLoading(false);
          return;
        }
        
        // GUARANTEED: Verify token before sending
        if (!idToken || typeof idToken !== 'string' || idToken.length < 10) {
          console.error('CRITICAL: Invalid token obtained:', idToken);
          setError('Invalid ID token received from Firebase');
          setIsLoading(false);
          return;
        }
        
        // GUARANTEED: Log request details
        const requestBody = JSON.stringify({ idToken });
        console.log('About to send request:', {
          url: '/api/auth/firebase',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          bodyPreview: requestBody.substring(0, 50) + '...',
          bodyLength: requestBody.length
        });
        
        const apiKeyResponse = await fetch('/api/auth/firebase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody,
        });
        
        console.log('Response received:', {
          status: apiKeyResponse.status,
          statusText: apiKeyResponse.statusText,
          ok: apiKeyResponse.ok
        });
        
        const apiKeyData = await apiKeyResponse.json();
        console.log('Response data:', apiKeyData);
        
        if (apiKeyResponse.ok) {
          // Store API key if available
          if (apiKeyData.apiKey) {
            localStorage.setItem('apiKey', JSON.stringify(apiKeyData.apiKey));
          }
          
          // Handle redirect if provided by the server
          if (apiKeyData.redirect) {
            console.log(`Redirecting to ${apiKeyData.redirect}`);
            window.location.href = apiKeyData.redirect;
            return; // Stop execution after redirect
          }
        } else {
          setError(apiKeyData.error || 'Failed to get API key');
          setIsLoading(false);
          return;
        }  
      }
      if (data.apiKey) {
        localStorage.setItem('apiKey', JSON.stringify(data.apiKey));
      }
      if (onSuccess) onSuccess(data.apiKey || "");
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
              />
              <button
                type="button"
                className="absolute right-2 top-2 text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Sign In'}
          </button>
          <div className="mt-4 text-center">
            <a href="/register" className="text-blue-600 hover:underline">
              Create an account
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
