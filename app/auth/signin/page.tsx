'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EmailSignInForm from '@/app/components/EmailSignInForm';
import { completeEmailSignIn, getStoredEmail, isEmailLink } from '@/app/lib/email-auth';

export default function SignInPage() {
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEmailLink = async () => {
      if (isEmailLink()) {
        setIsSigningIn(true);
        try {
          const email = getStoredEmail();
          if (!email) {
            setError('Please enter your email address to complete sign in');
            setIsSigningIn(false);
            return;
          }

          const result = await completeEmailSignIn(email, window.location.href);
          if (result.success) {
            router.push('/');
          } else {
            setError(result.error instanceof Error ? result.error.message : 'Failed to sign in');
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setIsSigningIn(false);
        }
      }
    };

    handleEmailLink();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Sign In</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to sign in
          </p>
        </div>

        {isSigningIn ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Signing you in...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-blue-500 hover:text-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <EmailSignInForm />
        )}
      </div>
    </div>
  );
} 