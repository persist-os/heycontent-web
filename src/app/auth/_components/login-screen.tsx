"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseAuth } from '@/app/lib/firebase';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';

import { Logo } from '@/components/ui/logo';
import { motion } from "framer-motion";
import Cookies from 'js-cookie';
import { waitForAuthReady } from '@/app/lib/api-helpers';

interface LoginScreenProps {
  onSuccess?: (apiKey: string) => void;
  reason?: string | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, reason }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authInitializing, setAuthInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ready = await waitForAuthReady(5, 150);
      if (!mounted) return;
      setAuthInitializing(false);
      if (!ready) {
        // Non-blocking: keep form usable but show a soft warning
        setError(prev => prev || 'Initializing authentication… If sign in fails, please retry.');
      }
    })();
    return () => { mounted = false };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    Cookies.remove('apiKey');
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
        // Use the enhanced token manager to get and store the token properly
        const { setFirebaseToken, updateTokenForUser } = await import('@/app/lib/firebase-token-manager');
        idToken = await updateTokenForUser(user, true);
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
        // Confirm cookie set by server; fallback to client set if needed
        const confirmCookie = async () => {
          const start = Date.now();
          const deadline = start + 500; // wait up to 500ms
          let cookie = Cookies.get('apiKey');
          while (!cookie && Date.now() < deadline) {
            await new Promise(r => setTimeout(r, 25));
            cookie = Cookies.get('apiKey');
          }
          if (!cookie && apiKeyData.apiKey) {
            Cookies.set('apiKey', JSON.stringify(apiKeyData.apiKey), { expires: 7, sameSite: 'Lax', secure: process.env.NODE_ENV === 'production', path: '/' });
          }
        };
        await confirmCookie();
        // Ensure client auth state has settled before redirect
        await waitForAuthReady(3, 200);
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

  const handleGoogleSignInError = (error: string) => {
    setError(error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background/80 via-muted/20 to-background/80 p-4">
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
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>
        <div className="space-y-6 bg-background/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-border">
          {reason === 'session_expired' && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl text-yellow-800 dark:text-yellow-200 text-sm">
              Your session has expired. Please sign in again.
            </div>
          )}
          {reason === 'logged_in_elsewhere' && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl text-blue-800 dark:text-blue-200 text-sm">
              You've been logged out because you signed in from another device. Please sign in again.
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-red-600 dark:text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Primary CTA: Google Sign-In */}
          <GoogleSignInButton 
            action="login"
            onError={handleGoogleSignInError}
          />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">or sign in with email</span>
            </div>
          </div>

          {/* Email/Password Fallback */}
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="w-4 h-4" />
                <span>Use email and password</span>
                <svg 
                  className="w-4 h-4 transition-transform group-open:rotate-180" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>
            
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 pl-11 bg-background text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-muted-foreground"
                required
                placeholder="Enter your email"
                title="Email address"
              />
              <Mail className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 pl-11 pr-11 bg-background text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-muted-foreground"
                required
                placeholder="Enter your password"
                title="Password"
              />
              <Lock className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 transform -translate-y-1/2" />
              <button
                type="button"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
              <div className="text-center">
                <a href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                  Forgot your password?
                </a>
              </div>
            </form>
          </details>

          {/* Sign up link */}
          <div className="text-center pt-4 border-t border-border">
            <a href="/auth/register" className="text-sm text-muted-foreground hover:text-foreground">
              Don't have an account? <span className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">Sign up</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
