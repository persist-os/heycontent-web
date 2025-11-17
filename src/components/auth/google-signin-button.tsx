"use client";

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/app/lib/google-auth';
import { T } from '@/components/translation';

interface GoogleSignInButtonProps {
  action?: 'login' | 'register';
  additionalData?: {
    username?: string;
    referredBy?: string;
  };
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

/**
 * Reusable Google Sign-In button component.
 * Follows Google's brand guidelines with proper styling and accessibility.
 */
export function GoogleSignInButton({
  action = 'login',
  additionalData,
  onSuccess,
  onError,
  className = '',
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      const result = await signInWithGoogle({
        action,
        additionalData,
      });
      
      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else if (result.redirect) {
          // Redirect to dashboard or specified route
          window.location.href = result.redirect;
        }
      } else {
        if (onError) {
          onError(result.error || 'Authentication failed');
        }
      }
    } catch (error: any) {
      if (onError) {
        onError(error.message || 'An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="google-signin"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className={className}
      aria-label={`Sign ${action === 'register' ? 'up' : 'in'} with Google`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>
            {action === 'register' ? (
              <T context="button.auth.signing-up-google">Signing up...</T>
            ) : (
              <T context="button.auth.signing-in-google">Signing in...</T>
            )}
          </span>
        </>
      ) : (
        <>
          <GoogleIcon />
          <span>
            <T context="button.auth.continue-google">Continue with Google</T>
          </span>
        </>
      )}
    </Button>
  );
}

/**
 * Official Google "G" logo SVG
 * Source: Google Brand Guidelines
 */
function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g fill="none" fillRule="evenodd">
        <path
          d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
          fill="#4285F4"
        />
        <path
          d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
          fill="#34A853"
        />
        <path
          d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
          fill="#FBBC05"
        />
        <path
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
          fill="#EA4335"
        />
      </g>
    </svg>
  );
}
