import React, { useState } from 'react';
import { Eye, EyeOff, Key, ArrowLeft } from 'lucide-react';

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
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 pl-11 pr-11 bg-white text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-500"
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
          onClick={onPrevious}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          disabled={isLoading || !isPasswordValid}
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>
      </div>
    </div>
  );
};

export default PasswordStep;
