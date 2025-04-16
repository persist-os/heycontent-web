'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/app/lib/firebase';
import { fetchWithAuth } from '@/app/lib/api-helpers';

export default function AuthTestPage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          setToken(token);
        } catch (err) {
          console.error('Error getting token:', err);
          setError('Failed to get token');
        }
      } else {
        setToken(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const testAuth = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      // Test the auth endpoint
      const response = await fetchWithAuth('/api/auth/test');
      const data = await response.json();

      setTestResult({
        status: response.status,
        data
      });
    } catch (err) {
      console.error('Auth test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testProfile = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      // Test the profile endpoint
      const response = await fetchWithAuth('/api/user/profile');
      const data = await response.json();

      setTestResult({
        status: response.status,
        data
      });
    } catch (err) {
      console.error('Profile test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testSocialPlatforms = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      // Test the social platforms endpoint
      const response = await fetchWithAuth('/api/social/connected-platforms');
      const data = await response.json();

      setTestResult({
        status: response.status,
        data
      });
    } catch (err) {
      console.error('Social platforms test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testDebug = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      // Test the debug endpoint
      const response = await fetchWithAuth('/api/debug');
      const data = await response.json();

      setTestResult({
        status: response.status,
        data
      });
    } catch (err) {
      console.error('Debug test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Authentication Test Page</h1>

      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">User Status</h2>
        {user ? (
          <div>
            <p className="text-green-600">✅ Logged in as: {user.email}</p>
            <p className="text-sm mt-2">User ID: {user.uid}</p>
            {token && (
              <div className="mt-2">
                <p className="text-sm font-semibold">ID Token:</p>
                <div className="bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-20 text-xs">
                  {token}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-red-600">❌ Not logged in</p>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={testAuth}
          disabled={loading || !user}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Test Auth Endpoint
        </button>

        <button
          onClick={testProfile}
          disabled={loading || !user}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          Test Profile Endpoint
        </button>

        <button
          onClick={testSocialPlatforms}
          disabled={loading || !user}
          className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
        >
          Test Social Platforms
        </button>

        <button
          onClick={testDebug}
          disabled={loading || !user}
          className="px-4 py-2 bg-orange-500 text-white rounded disabled:opacity-50"
        >
          Test Debug Endpoint
        </button>
      </div>

      {loading && (
        <div className="mb-4 text-blue-600">
          Loading...
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded">
          <h3 className="font-semibold text-red-700">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {testResult && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Test Result:</h3>
          <div className={`p-3 border rounded ${
            testResult.status >= 200 && testResult.status < 300
              ? 'bg-green-100 border-green-300'
              : 'bg-red-100 border-red-300'
          }`}>
            <p className="font-medium">Status: {testResult.status}</p>
            <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-60 text-xs">
              {JSON.stringify(testResult.data, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Debugging Tips</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Check that the token is being sent in the Authorization header</li>
          <li>Verify that the token is valid and not expired</li>
          <li>Make sure your NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable is set correctly</li>
          <li>Look at server logs for any errors in token verification</li>
          <li>If you see issuer/audience validation errors, check that your Firebase project ID matches</li>
        </ul>
      </div>

      <div className="mt-4 p-4 border rounded bg-blue-50">
        <h2 className="text-xl font-semibold mb-2">Environment Check</h2>
        <p className="mb-2">Firebase Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set'}</p>
        <p className="text-sm text-gray-600">This should match the project ID in your Firebase console.</p>
      </div>
    </div>
  );
}
