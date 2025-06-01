import React, { useState } from 'react';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { getFirebaseAuth } from '@/app/lib/firebase';
import { usePasswordValidation, useReferralValidation } from '../hooks';

interface RegistrationFormProps {
  onSuccess: (name: string) => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { passwordValid, isPasswordValid } = usePasswordValidation(password);
  const {
    referralCode,
    referredByName,
    referredById,
    referralCodeValid,
    error: referralError,
    checkReferralCode,
    handleReferralCodeChange,
  } = useReferralValidation();

  const handleSubmit = async (e: React.FormEvent) => {
    localStorage.removeItem('apiKey');
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Username must not be empty or whitespace
    if (!username.trim()) {
      setError('Username is required.');
      setIsLoading(false);
      return;
    }

    // If a referral code is present, it must be valid and referredById must not be blank
    if (referralCode) {
      if (!referralCodeValid || !referredById) {
        setError('Please enter a valid referral code.');
        setIsLoading(false);
        return;
      }
    }

    try {
      // Use Firebase Auth to register the user
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
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
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        setError('Registration failed: ' + (err.message || err.code));
        setIsLoading(false);
        return;
      }

      const user = userCredential.user;
      if (!user) {
        setError('Registration failed: No user returned.');
        setIsLoading(false);
        return;
      }

      // Optionally update displayName
      try {
        await updateProfile(user, { displayName: name });
      } catch (err) {
        // Not fatal, but you can log or show a warning
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

      // Send ID token and user info to backend
      const payload: any = {
        idToken,
        name,
        action: 'register',
      };
      if (username && username.trim()) (payload as any).username = username.trim();
      if (referralCode && referralCodeValid && referredById) (payload as any).referredBy = referredById;
      console.log('[Registration] About to send to API:', payload);
      
      const apiKeyResponse = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const apiKeyData = await apiKeyResponse.json();
      if (apiKeyResponse.ok && apiKeyData.apiKey) {
        localStorage.setItem('apiKey', JSON.stringify(apiKeyData.apiKey));
        onSuccess(name);
      } else {
        setError(apiKeyData.error || 'Failed to get API key');
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = error || referralError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white shadow-lg rounded-xl p-4 sm:p-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-1">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Referral Code</label>
        <input
          type="text"
          value={referralCode}
          onChange={e => handleReferralCodeChange(e.target.value)}
          className={`w-full border rounded px-3 py-2 ${referralCodeValid ? 'border-green-500' : ''}`}
          placeholder="Enter your referral code"
          required
        />
        {checkReferralCode === undefined && referralCode && (
          <div className="text-sm text-gray-500 mt-1">Validating code...</div>
        )}
        {referralCodeValid && (
          <div className="text-sm text-green-500 mt-1">Referral code valid!</div>
        )}
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
        <div className="relative">
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2 pr-10"
            required
          />
          <span className="absolute right-2 top-2 text-gray-400">
            <Mail size={18} />
          </span>
        </div>
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
        <div className="relative">
          <input
            id="password"
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
        
        {/* Password requirements UI */}
        <ul className="mt-2 text-xs space-y-1">
          <li className={passwordValid.upper ? 'text-green-600' : 'text-gray-500'}>
            {passwordValid.upper ? '✓' : '•'} At least one uppercase letter
          </li>
          <li className={passwordValid.lower ? 'text-green-600' : 'text-gray-500'}>
            {passwordValid.lower ? '✓' : '•'} At least one lowercase letter
          </li>
          <li className={passwordValid.number ? 'text-green-600' : 'text-gray-500'}>
            {passwordValid.number ? '✓' : '•'} At least one number
          </li>
          <li className={passwordValid.special ? 'text-green-600' : 'text-gray-500'}>
            {passwordValid.special ? '✓' : '•'} At least one special character
          </li>
          <li className={passwordValid.length ? 'text-green-600' : 'text-gray-500'}>
            {passwordValid.length ? '✓' : '•'} At least 8 characters
          </li>
        </ul>
      </div>
      
      {displayError && <div className="text-red-500 text-sm">{displayError}</div>}
      
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        disabled={
          isLoading ||
          !isPasswordValid ||
          (referralCode && (!referralCodeValid || !referredById || checkReferralCode === undefined))
        }
      >
        {isLoading ? 'Loading...' : 'Register'}
      </button>
      
      <div className="mt-4 text-center">
        <a href="/auth/login" className="text-blue-600 hover:underline">
          Already have an account? Sign In
        </a>
      </div>
    </form>
  );
};

export default RegistrationForm; 