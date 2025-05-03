import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Mail, Lock, Eye, EyeOff, Chrome } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface AuthFormProps {
  isLogin?: boolean;
  onAuthSuccess: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ isLogin = true, onAuthSuccess, onLoadingChange }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    // Always clear any previous API key before login/register to avoid mismatches
    localStorage.removeItem('apiKey');
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    onLoadingChange?.(true);
    try {
      const response = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          action: isLogin ? 'login' : 'register',
          ...(isLogin ? {} : { name }),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }
      // If backend returns a customToken, sign in with it and get the ID token
      if (data.customToken) {
        // Dynamically import firebase/auth to avoid SSR issues
        const { getAuth, signInWithCustomToken } = await import('firebase/auth');
        const auth = getAuth();
        try {
          await signInWithCustomToken(auth, data.customToken);
        } catch (err: any) {
          setError('Firebase sign-in with custom token failed: ' + (err.message || err.code));
          return;
        }
        let idToken: string | undefined;
        try {
          // This ensures the ID token is fresh and valid
          idToken = await auth.currentUser?.getIdToken(true);
        } catch (err: any) {
          setError('Failed to get Firebase ID token: ' + (err.message || err.code));
          return;
        }
        // Now send the ID token to your backend to get the API key
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
            return;
          }
        }
      }
      // Only signal success, do not pass API key. Waitlist will handle API key generation.
      if (data.apiKey) {
        localStorage.setItem('apiKey', JSON.stringify(data.apiKey));
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-0 sm:p-4 w-full">
  <Card className="w-full sm:max-w-md sm:mx-auto mx-0 shadow-lg rounded-xl bg-white p-4 sm:p-8">

      <CardHeader>
        <CardTitle>{isLogin ? 'Sign In' : 'Register'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
          )}
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
              <Mail className="absolute right-2 top-2 text-gray-400" size={18} />
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
            {isLoading ? 'Loading...' : isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href={isLogin ? '/register' : '/login'} className="text-blue-600 hover:underline">
            {isLogin ? 'Create an account' : 'Already have an account? Sign In'}
          </Link>
        </div>
      </CardContent>
    </Card>
  </div>
  );
};

export default AuthForm;
