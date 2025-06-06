import React, { useState } from 'react';
import { Eye, EyeOff, Mail, User, AtSign, Key, ArrowLeft, ArrowRight } from 'lucide-react';
import { getFirebaseAuth } from '@/app/lib/firebase';
import { usePasswordValidation, useReferralValidation } from '../hooks';
import { Logo } from '@/components/ui/logo';
import { motion } from "framer-motion";

interface RegistrationFormProps {
  onSuccess: (name: string) => void;
}

type RegistrationStep = 'referral' | 'basic' | 'password';

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess }) => {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('referral');
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

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
    if (!referralCodeValid || !referredById) {
      setError('Please enter a valid referral code.');
      setIsLoading(false);
      return;
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

  const handleNextStep = () => {
    if (currentStep === 'referral' && referralCodeValid && referredById) {
      setCurrentStep('basic');
    } else if (currentStep === 'basic') {
      setCurrentStep('password');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'password') {
      setCurrentStep('basic');
    } else if (currentStep === 'basic') {
      setCurrentStep('referral');
    }
  };

  const displayError = error || referralError;

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-4">
        {(['referral', 'basic', 'password'] as RegistrationStep[]).map((step, index) => (
          <React.Fragment key={step}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step
                  ? 'bg-blue-600 text-white'
                  : currentStep === 'referral' && step === 'basic'
                  ? 'bg-gray-200 text-gray-600'
                  : currentStep === 'basic' && step === 'password'
                  ? 'bg-gray-200 text-gray-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {index + 1}
            </div>
            {index < 2 && (
              <div
                className={`w-12 h-0.5 ${
                  currentStep === step || (currentStep === 'basic' && step === 'referral')
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderReferralStep = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Referral Code</label>
        <div className="relative">
          <input
            type="text"
            value={referralCode}
            onChange={e => handleReferralCodeChange(e.target.value)}
            className={`w-full px-4 py-3 pl-11 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              referralCodeValid ? 'border-green-500' : 'border-gray-200'
            }`}
            placeholder="Enter your referral code"
            required
          />
          <Key className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
        </div>
        {checkReferralCode === undefined && referralCode && (
          <div className="text-sm text-gray-500 mt-1">Validating code...</div>
        )}
        {referralCodeValid && (
          <div className="text-sm text-green-600 mt-1">✓ Valid referral code</div>
        )}
      </div>
      <button
        type="button"
        onClick={handleNextStep}
        disabled={!referralCodeValid || !referredById}
        className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        Continue
      </button>
    </div>
  );

  const renderBasicStep = () => (
    <div className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
        <div className="relative">
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 pl-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
            placeholder="Enter your full name"
          />
          <User className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>
      
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
        <div className="relative">
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-3 pl-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
            placeholder="Choose a username"
          />
          <AtSign className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <div className="relative">
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 pl-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
            placeholder="Enter your email"
          />
          <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={handlePreviousStep}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <button
          type="button"
          onClick={handleNextStep}
          disabled={!name.trim() || !username.trim() || !email.trim()}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const renderPasswordStep = () => (
    <div className="space-y-6">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 pl-11 pr-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
            placeholder="Create a password"
          />
          <Key className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <button
            type="button"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        
        {/* Password requirements UI */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowPasswordRequirements(!showPasswordRequirements)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="mr-1">Password requirements</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${showPasswordRequirements ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showPasswordRequirements && (
            <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <ul className="space-y-1.5 text-sm">
                <li className={`flex items-center ${passwordValid.upper ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{passwordValid.upper ? '✓' : '•'}</span>
                  At least one uppercase letter
                </li>
                <li className={`flex items-center ${passwordValid.lower ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{passwordValid.lower ? '✓' : '•'}</span>
                  At least one lowercase letter
                </li>
                <li className={`flex items-center ${passwordValid.number ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{passwordValid.number ? '✓' : '•'}</span>
                  At least one number
                </li>
                <li className={`flex items-center ${passwordValid.special ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{passwordValid.special ? '✓' : '•'}</span>
                  At least one special character
                </li>
                <li className={`flex items-center ${passwordValid.length ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{passwordValid.length ? '✓' : '•'}</span>
                  At least 8 characters
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {displayError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {displayError}
        </div>
      )}

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={handlePreviousStep}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          disabled={
            isLoading ||
            !isPasswordValid
          }
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>
      </div>
    </div>
  );

  return (
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
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="text-gray-600 mt-2">Join HeyContent today</p>
      </div>

      {renderStepIndicator()}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8">
        {currentStep === 'referral' && renderReferralStep()}
        {currentStep === 'basic' && renderBasicStep()}
        {currentStep === 'password' && renderPasswordStep()}
        
        <div className="text-center">
          <a href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
            Already have an account? <span className="text-blue-600 hover:text-blue-700 font-medium">Sign in</span>
          </a>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm; 