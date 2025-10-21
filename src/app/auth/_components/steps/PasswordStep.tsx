import React, { useState } from 'react';
import { Eye, EyeOff, Key, ArrowLeft } from 'lucide-react';
import { T } from '@/components/translation';

interface PasswordRequirements {
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
  length: boolean;
}

interface PasswordStepProps {
  password: string;
  setPassword: (password: string) => void;
  passwordValid: PasswordRequirements;
  isPasswordValid: boolean;
  isLoading: boolean;
  displayError: string | null;
  onPrevious: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const PasswordStep: React.FC<PasswordStepProps> = ({
  password,
  setPassword,
  passwordValid,
  isPasswordValid,
  isLoading,
  displayError,
  onPrevious,
  onSubmit
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
          <T context="label.auth.password">Password</T>
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 pl-11 pr-11 bg-background text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-muted-foreground"
            required
            placeholder="Create a password"
          />
          <Key className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 transform -translate-y-1/2" />
          <button
            type="button"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowPasswordRequirements(!showPasswordRequirements)}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="mr-1">
              <T context="label.auth.password-requirements">Password requirements</T>
            </span>
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
            <div className="mt-2 p-3 bg-muted rounded-xl border border-border">
              <ul className="space-y-1.5 text-sm">
                <li className={`flex items-center ${passwordValid.upper ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  <span className="mr-2">{passwordValid.upper ? '✓' : '•'}</span>
                  <T context="message.auth.req-uppercase">At least one uppercase letter</T>
                </li>
                <li className={`flex items-center ${passwordValid.lower ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  <span className="mr-2">{passwordValid.lower ? '✓' : '•'}</span>
                  <T context="message.auth.req-lowercase">At least one lowercase letter</T>
                </li>
                <li className={`flex items-center ${passwordValid.number ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  <span className="mr-2">{passwordValid.number ? '✓' : '•'}</span>
                  <T context="message.auth.req-number">At least one number</T>
                </li>
                <li className={`flex items-center ${passwordValid.special ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  <span className="mr-2">{passwordValid.special ? '✓' : '•'}</span>
                  <T context="message.auth.req-special">At least one special character</T>
                </li>
                <li className={`flex items-center ${passwordValid.length ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  <span className="mr-2">{passwordValid.length ? '✓' : '•'}</span>
                  <T context="message.auth.req-length">At least 8 characters</T>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {displayError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-red-600 dark:text-red-200 text-sm">
          {displayError}
        </div>
      )}

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onPrevious}
          className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-xl hover:bg-secondary/80 transition-colors font-medium flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <T context="button.auth.back">Back</T>
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          disabled={isLoading || !isPasswordValid}
        >
          {isLoading ? (
            <T context="button.auth.creating-account">Creating account...</T>
          ) : (
            <T context="button.auth.create-account">Create Account</T>
          )}
        </button>
      </div>
    </div>
  );
};

export default PasswordStep;
