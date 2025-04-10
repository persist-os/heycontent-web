'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

export default function AuthError() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  useEffect(() => {
    if (error === 'AccessDenied') {
      console.error('Access was denied. Please check your Google OAuth configuration.');
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-red-600">Authentication Error</h1>
        <p className="mb-4 text-gray-600">
          {error === 'AccessDenied'
            ? 'Access was denied. Please check your Google OAuth configuration.'
            : 'An error occurred during authentication.'}
        </p>
        <button
          onClick={() => router.push('/')}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
} 