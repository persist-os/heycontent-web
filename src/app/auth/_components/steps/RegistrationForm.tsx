import React, { useState } from 'react';
import { getFirebaseAuth } from '@/app/lib/firebase';
import { useReferralValidation } from '../hooks/useReferralValidation';
import { usePasswordValidation } from '../hooks/usePasswordValidation';
import { Logo } from '@/components/ui/logo';
import { motion } from "framer-motion";
import ReferralStep from './ReferralStep';
import BasicInfoStep from './BasicInfoStep';
import PasswordStep from './PasswordStep';
import StepIndicator from './StepIndicator';

interface RegistrationFormProps {
  onSuccess: (name: string) => void;
}

type RegistrationStep = 'referral' | 'basic' | 'password';

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess }) => {
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
    handleReferralCodeChange,
    checkReferralCode,
  } = useReferralValidation();

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

      <StepIndicator currentStep={currentStep} />

      <form onSubmit={handleSubmit} className="space-y-6 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8">
        {currentStep === 'referral' && (
          <ReferralStep
            referralCode={referralCode}
            handleReferralCodeChange={handleReferralCodeChange}
            referralCodeValid={referralCodeValid}
            checkReferralCode={checkReferralCode}
            referredById={referredById}
            onNext={handleNextStep}
          />
        )}
        
        {currentStep === 'basic' && (
          <BasicInfoStep
            name={name}
            setName={setName}
            username={username}
            setUsername={setUsername}
            email={email}
            setEmail={setEmail}
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
          />
        )}
        
        {currentStep === 'password' && (
          <PasswordStep
            password={password}
            setPassword={setPassword}
            passwordValid={passwordValid}
            isPasswordValid={isPasswordValid}
            isLoading={isLoading}
            displayError={displayError}
            onPrevious={handlePreviousStep}
            onSubmit={handleSubmit}
          />
        )}

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