'use client';

import { useState } from 'react';
import { sendEmailLink } from '@/app/lib/email-auth';

export default function EmailSignInForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);

    try {
      const result = await sendEmailLink(email);
      
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setError(result.error instanceof Error ? result.error.message : 'Failed to send email link');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Sign in with Email Link</h2>
      
      {status === 'success' ? (
        <div className="text-center">
          <div className="text-green-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">
            We sent a sign-in link to {email}
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="text-blue-500 hover:text-blue-700"
          >
            Send another link
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={status === 'loading'}
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={status === 'loading'}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              status === 'loading'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {status === 'loading' ? 'Sending...' : 'Send Sign-in Link'}
          </button>
        </form>
      )}
    </div>
  );
} 